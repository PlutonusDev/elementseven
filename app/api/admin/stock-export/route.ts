import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { reservedQuantities } from "@/lib/stock";

function csvCell(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { name: true, brand: true, category: true } } },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
  });
  const reserved = await reservedQuantities(variants.map((v) => v.id));

  const header = [
    "product",
    "brand",
    "category",
    "sku",
    "flavour",
    "strength_mg",
    "price_cents",
    "stock_qty",
    "reserved_qty",
    "weight_grams",
    "active",
  ].join(",");

  const rows = variants.map((v) =>
    [
      csvCell(v.product.name),
      csvCell(v.product.brand),
      csvCell(v.product.category),
      csvCell(v.sku),
      csvCell(v.flavour),
      csvCell(v.strengthMg),
      csvCell(v.priceCents),
      csvCell(v.stockQty),
      csvCell(reserved.get(v.id) ?? 0),
      csvCell(v.weightGrams),
      csvCell(v.active ? "yes" : "no"),
    ].join(","),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="element-seven-stock-${stamp}.csv"`,
    },
  });
}
