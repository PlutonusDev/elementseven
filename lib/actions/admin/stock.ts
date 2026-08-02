"use server";

import { StockReason } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { zodMessage, type ActionState } from "../types";

const ADJUSTMENT_REASONS = [
  StockReason.RECEIVED,
  StockReason.ADJUSTMENT,
  StockReason.CORRECTION,
  StockReason.DAMAGED,
  StockReason.REFUND_RESTOCK,
] as const;

const adjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, "Delta can't be zero"),
  reason: z.enum(ADJUSTMENT_REASONS, { message: "Choose a reason" }),
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = adjustSchema.safeParse({
    variantId: formData.get("variantId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const { variantId, delta, reason, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.updateMany({
        where: { id: variantId, ...(delta < 0 ? { stockQty: { gte: -delta } } : {}) },
        data: { stockQty: { increment: delta } },
      });
      if (updated.count === 0) {
        throw new Error("Adjustment would take stock below zero.");
      }
      await tx.stockMovement.create({
        data: { variantId, delta, reason, note, actorId: session.user.id },
      });
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Adjustment failed." };
  }

  revalidatePath("/admin/stock");
  revalidatePath(`/admin/stock/${variantId}`);
  revalidatePath("/products");
  return { ok: true, message: `Stock adjusted by ${delta > 0 ? "+" : ""}${delta}.` };
}
