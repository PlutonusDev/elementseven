import Link from "next/link";
import { notFound } from "next/navigation";
import { variantLabel } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { reservedQuantities } from "@/lib/stock";
import { AdminCard, AdminPageHeader, StatCard, Td, Th } from "@/components/admin/ui";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { Badge } from "@/components/ui";

export const metadata = { title: "Variant stock" };

const REASON_LABELS: Record<string, string> = {
  SALE: "Sale",
  RECEIVED: "Received",
  ADJUSTMENT: "Adjustment",
  CORRECTION: "Correction",
  DAMAGED: "Damaged",
  REFUND_RESTOCK: "Refund restock",
};

export default async function VariantStockPage({ params }: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await params;
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          actor: { select: { name: true, email: true } },
          order: { select: { number: true, id: true } },
        },
      },
    },
  });
  if (!variant) notFound();

  const reserved = (await reservedQuantities([variantId])).get(variantId) ?? 0;
  const available = Math.max(0, variant.stockQty - reserved);

  return (
    <div>
      <AdminPageHeader
        title={variant.product.name}
        description={`${variantLabel(variant.flavour, variant.strengthMg)} · ${variant.sku}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href={`/admin/products/${variant.product.id}`} className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              Edit product
            </Link>
            <Link href="/admin/stock" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              ← Stock
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="On hand" value={String(variant.stockQty)} />
        <StatCard label="Reserved" value={String(reserved)} hint="Held by active checkouts" />
        <StatCard label="Available" value={String(available)} />
      </div>

      <AdminCard className="mt-4 p-5">
        <h2 className="font-display text-sm font-bold">Adjust stock</h2>
        <p className="mt-1 text-xs text-slate">Every adjustment is recorded below with your name and reason.</p>
        <div className="mt-3">
          <StockAdjust variantId={variant.id} />
        </div>
      </AdminCard>

      <AdminCard className="mt-4">
        <div className="border-b border-mist px-4 py-3">
          <h2 className="font-display text-sm font-bold">Movement history</h2>
        </div>
        {variant.movements.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate">No movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Reason</Th>
                  <Th className="text-right">Change</Th>
                  <Th>Note</Th>
                  <Th>By</Th>
                </tr>
              </thead>
              <tbody>
                {variant.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-paper">
                    <Td className="whitespace-nowrap text-slate">{formatDateTime(m.createdAt)}</Td>
                    <Td>
                      <Badge tone={m.reason === "SALE" ? "ink" : "neutral"}>
                        {REASON_LABELS[m.reason] ?? m.reason}
                      </Badge>
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      <span className={m.delta < 0 ? "text-alert" : "text-nitro"}>
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </span>
                    </Td>
                    <Td className="text-slate">
                      {m.order ? (
                        <Link href={`/admin/orders/${m.order.id}`} className="text-nitro underline underline-offset-2">
                          {m.order.number}
                        </Link>
                      ) : (
                        (m.note ?? "—")
                      )}
                    </Td>
                    <Td className="text-slate">{m.actor?.name ?? m.actor?.email ?? "System"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
