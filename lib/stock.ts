import { prisma } from "@/lib/db";

export async function reservedQuantities(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const groups = await prisma.stockReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, expiresAt: { gt: new Date() } },
    _sum: { quantity: true },
  });
  return new Map(groups.map((g) => [g.variantId, g._sum.quantity ?? 0]));
}

export async function availableQuantities(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const [variants, reserved] = await Promise.all([
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stockQty: true },
    }),
    reservedQuantities(variantIds),
  ]);
  return new Map(
    variants.map((v) => [v.id, Math.max(0, v.stockQty - (reserved.get(v.id) ?? 0))]),
  );
}

export async function availableQuantity(variantId: string): Promise<number> {
  const map = await availableQuantities([variantId]);
  return map.get(variantId) ?? 0;
}

export async function releaseExpiredReservations(): Promise<void> {
  await prisma.stockReservation.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
