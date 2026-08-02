"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SmokingStatus } from "@prisma/client";
import { z } from "zod";
import { QUIT_AIDS } from "@/lib/access-constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { zodMessage, type ActionState } from "./types";

const requestSchema = z.object({
  dateOfBirth: z
    .string()
    .min(1, "Enter your date of birth")
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Enter a valid date of birth")
    .refine((d) => {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return d <= cutoff;
    }, "You must be 18 or older to apply")
    .refine((d) => d > new Date("1900-01-01"), "Enter a valid date of birth"),
  smokingStatus: z.nativeEnum(SmokingStatus, { message: "Tell us about your smoking status" }),
  cigarettesPerDay: z.coerce.number().int().min(0).max(200).optional(),
  yearsSmoked: z.coerce.number().int().min(0).max(100).optional(),
  vapedBefore: z.enum(["yes", "no"], { message: "Tell us if you've vaped before" }),
  quitIntent: z.enum(["yes", "no"], { message: "Answer the quit-intent question" }),
  aidsTried: z.array(z.enum(QUIT_AIDS)).default([]),
  extraNotes: z
    .string()
    .trim()
    .max(1000, "Keep notes under 1,000 characters")
    .optional()
    .transform((v) => (v ? v : null)),
  declarations: z.literal("on", { message: "You must accept the declarations to submit" }),
});

export async function submitAccessRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Please sign in before applying for access." };
  }
  if (!(await rateLimit("access-request", 5, 10 * 60_000))) {
    return { ok: false, message: "Too many attempts, please wait a few minutes." };
  }

  const parsed = requestSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    smokingStatus: formData.get("smokingStatus"),
    cigarettesPerDay: formData.get("cigarettesPerDay") || undefined,
    yearsSmoked: formData.get("yearsSmoked") || undefined,
    vapedBefore: formData.get("vapedBefore"),
    quitIntent: formData.get("quitIntent"),
    aidsTried: formData.getAll("aidsTried"),
    extraNotes: formData.get("extraNotes") ?? undefined,
    declarations: formData.get("declarations"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const existing = await prisma.accessRequest.findUnique({
    where: { userId: session.user.id },
  });
  if (existing && existing.status !== "DENIED") {
    return {
      ok: false,
      message:
        existing.status === "APPROVED"
          ? "Your access is already approved."
          : "Your application is already under review.",
    };
  }

  const data = {
    status: "PENDING" as const,
    dateOfBirth: parsed.data.dateOfBirth,
    smokingStatus: parsed.data.smokingStatus,
    cigarettesPerDay: parsed.data.cigarettesPerDay ?? null,
    yearsSmoked: parsed.data.yearsSmoked ?? null,
    vapedBefore: parsed.data.vapedBefore === "yes",
    quitIntent: parsed.data.quitIntent === "yes",
    aidsTried: parsed.data.aidsTried,
    extraNotes: parsed.data.extraNotes,
    decisionNote: null,
    decidedAt: null,
    decidedById: null,
  };

  await prisma.accessRequest.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  revalidatePath("/", "layout");
  redirect("/request-access?submitted=1");
}
