import Link from "next/link";
import { LOW_STOCK_THRESHOLD, variantLabel } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatCents, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AdminCard, AdminPageHeader, StatCard, Td, Th } from "@/components/admin/ui";
import type { OrderStatus } from "@prisma/client";

const REVENUE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function AdminDashboardPage() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000);
  const d30 = new Date(now - 30 * 86400000);

  const [rev7, rev30, statusCounts, lowStock, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, paidAt: { gte: d7 } },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, paidAt: { gte: d30 } },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.productVariant.findMany({
      where: { active: true, stockQty: { lte: LOW_STOCK_THRESHOLD }, product: { published: true } },
      include: { product: { select: { name: true, id: true } } },
      orderBy: { stockQty: "asc" },
      take: 10,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { items: true } } },
    }),
  ]);

  const countFor = (status: OrderStatus) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Trading overview and things needing attention" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue · 7 days"
          value={formatCents(rev7._sum.totalCents ?? 0)}
          hint={`${rev7._count._all} paid orders`}
        />
        <StatCard
          label="Revenue · 30 days"
          value={formatCents(rev30._sum.totalCents ?? 0)}
          hint={`${rev30._count._all} paid orders`}
        />
        <StatCard
          label="Awaiting action"
          value={String(countFor("PAID") + countFor("PROCESSING"))}
          hint="Paid or processing"
        />
        <StatCard
          label="Low stock variants"
          value={String(lowStock.length)}
          hint={`At or below ${LOW_STOCK_THRESHOLD} units`}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-7">
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="border border-mist bg-white px-3 py-2.5 transition-colors hover:border-ink"
          >
            <span className="block text-[11px] font-medium tracking-wider text-slate uppercase">
              {STATUS_LABELS[status]}
            </span>
            <span className="font-display text-lg font-bold tabular-nums">{countFor(status)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-mist px-4 py-3">
            <h2 className="font-display text-sm font-bold">Low stock</h2>
            <Link href="/admin/stock" className="text-xs text-slate underline underline-offset-2 hover:text-ink">
              All stock
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate">No variants at or below the threshold. 👌</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Variant</Th>
                  <Th className="text-right">Stock</Th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/stock/${v.id}`} className="font-medium hover:underline">
                        {v.product.name}
                      </Link>
                      <span className="block text-xs text-slate">{v.sku}</span>
                    </Td>
                    <Td>{variantLabel(v.flavour, v.strengthMg)}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      <span className={v.stockQty === 0 ? "text-alert" : "text-nitro"}>
                        {v.stockQty}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between border-b border-mist px-4 py-3">
            <h2 className="font-display text-sm font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-slate underline underline-offset-2 hover:text-ink">
              All orders
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate">No orders yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Placed</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        {order.number}
                      </Link>
                      <span className="block text-xs text-slate">
                        {order._count.items} item{order._count.items === 1 ? "" : "s"}
                      </span>
                    </Td>
                    <Td className="text-slate">{formatDateTime(order.createdAt)}</Td>
                    <Td>
                      <OrderStatusBadge status={order.status} />
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatCents(order.totalCents)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
