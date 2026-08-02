"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";
import { zodMessage, type ActionState } from "./types";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const addressFormSchema = addressSchema.extend({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Give this address a label").max(40),
});

export async function saveAddressAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "Please sign in first." };

  const parsed = addressFormSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? undefined,
    suburb: formData.get("suburb"),
    state: formData.get("state"),
    postcode: formData.get("postcode"),
    phone: formData.get("phone") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const { id, ...data } = parsed.data;
  const isDefault = formData.get("isDefault") === "on";

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    if (id) {
      const owned = await tx.address.findFirst({ where: { id, userId } });
      if (!owned) throw new Error("Address not found");
      await tx.address.update({ where: { id }, data: { ...data, isDefault } });
    } else {
      const count = await tx.address.count({ where: { userId } });
      await tx.address.create({
        data: { ...data, userId, isDefault: isDefault || count === 0 },
      });
    }
  });

  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const id = String(formData.get("id") ?? "");
  await prisma.address.deleteMany({ where: { id, userId } });
  revalidatePath("/account/addresses");
}

export async function updateMarketingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "Please sign in first." };
  const optIn = formData.get("marketingOptIn") === "on";
  await prisma.user.update({ where: { id: userId }, data: { marketingOptIn: optIn } });
  revalidatePath("/account/preferences");
  return {
    ok: true,
    message: optIn ? "You're subscribed to marketing emails." : "You've been unsubscribed.",
  };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "Please sign in first." };
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}
