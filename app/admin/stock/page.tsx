import Link from "next/link";
import { LOW_STOCK_THRESHOLD, variantLabel } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { reservedQuantities } from "@/lib/stock";
import { AdminCard, AdminPageHeader, Td, Th } from "@/components/admin/ui";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { Badge, buttonClass, cx } from "@/components/ui";

export const metadata = { title: "Stock" };

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const lowOnly = filter === "low";

  const variants = await prisma.productVariant.findMany({
    where: { active: true, ...(lowOnly ? { stockQty: { lte: LOW_STOCK_THRESHOLD } } : {}) },
    include: { product: { select: { name: true } } },
    orderBy: [{ stockQty: "asc" }, { product: { name: "asc" } }],
  });
  const reserved = await reservedQuantities(variants.map((v) => v.id));

  return (
    <div>
      <AdminPageHeader
        title="Stock"
        description={`${variants.length} active variant${variants.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={lowOnly ? "/admin/stock" : "/admin/stock?filter=low"}
              className={cx(
                "border px-3 py-1.5 text-[13px] transition-colors",
                lowOnly ? "border-ink bg-ink text-paper" : "border-mist bg-white hover:border-ink",
              )}
            >
              {lowOnly ? "Showing low stock" : "Low stock only"}
            </Link>
            <a href="/api/admin/stock-export" className={buttonClass("secondary", "sm")}>
              Export CSV
            </a>
          </div>
        }
      />

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <Th>Product / SKU</Th>
                <Th>Variant</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">On hand</Th>
                <Th className="text-right">Reserved</Th>
                <Th className="text-right">Available</Th>
                <Th>Adjust</Th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const res = reserved.get(v.id) ?? 0;
                const available = Math.max(0, v.stockQty - res);
                return (
                  <tr key={v.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/stock/${v.id}`} className="font-medium hover:underline">
                        {v.product.name}
                      </Link>
                      <span className="block font-mono text-xs text-slate">{v.sku}</span>
                    </Td>
                    <Td className="text-slate">{variantLabel(v.flavour, v.strengthMg)}</Td>
                    <Td className="text-right tabular-nums">
                      {v.priceCents === null ? <span className="text-slate">base</span> : formatCents(v.priceCents)}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {v.stockQty === 0 ? (
                        <Badge tone="alert">0</Badge>
                      ) : v.stockQty <= LOW_STOCK_THRESHOLD ? (
                        <span className="font-medium text-nitro">{v.stockQty}</span>
                      ) : (
                        v.stockQty
                      )}
                    </Td>
                    <Td className="text-right tabular-nums text-slate">{res}</Td>
                    <Td className="text-right tabular-nums font-medium">{available}</Td>
                    <Td>
                      <StockAdjust variantId={v.id} compact />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
