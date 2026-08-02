import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCents, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AdminCard, AdminPageHeader, Td, Th } from "@/components/admin/ui";
import { cx, EmptyState } from "@/components/ui";

export const metadata = { title: "Orders" };

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUS_ORDER.find((s) => s === sp.status);
  const q = sp.q?.trim();

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cx(
        "border px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-mist bg-white hover:border-ink",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <AdminPageHeader title="Orders" description={`${orders.length} shown`} />

      <div className="mb-3 flex flex-wrap gap-2">
        {tab("/admin/orders", "All", !status)}
        {STATUS_ORDER.map((s) => tab(`/admin/orders?status=${s}`, STATUS_LABELS[s], status === s))}
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search order # or email"
          className="border border-mist bg-white px-3 py-1.5 text-[13px] focus:border-ink"
        />
        <button type="submit" className="border border-ink bg-white px-3 py-1.5 text-[13px] hover:bg-paper">
          Search
        </button>
      </form>

      <AdminCard>
        {orders.length === 0 ? (
          <EmptyState symbol="Or" title="No orders" body="No orders match this view yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Placed</Th>
                  <Th>Customer</Th>
                  <Th className="text-right">Items</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        {order.number}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-slate">{formatDateTime(order.createdAt)}</Td>
                    <Td className="text-slate">{order.email}</Td>
                    <Td className="text-right tabular-nums">{order._count.items}</Td>
                    <Td>
                      <OrderStatusBadge status={order.status} />
                    </Td>
                    <Td className="text-right font-medium tabular-nums">{formatCents(order.totalCents)}</Td>
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
