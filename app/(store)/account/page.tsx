import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/db";
import { formatCents, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { buttonClass, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireUser("/account");
  const [user, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-slate">
            {user?.name ? `${user.name} · ` : ""}
            {session.user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate underline underline-offset-2 transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      <nav aria-label="Account sections" className="mt-6 flex flex-wrap gap-2">
        <span className="border border-ink bg-ink px-3 py-1.5 text-[13px] font-medium text-paper">
          Orders
        </span>
        <Link
          href="/account/addresses"
          className="border border-mist bg-white px-3 py-1.5 text-[13px] text-slate transition-colors hover:border-ink hover:text-ink"
        >
          Addresses
        </Link>
        <Link
          href="/account/preferences"
          className="border border-mist bg-white px-3 py-1.5 text-[13px] text-slate transition-colors hover:border-ink hover:text-ink"
        >
          Email preferences
        </Link>
        <Link
          href="/request-access"
          className="border border-mist bg-white px-3 py-1.5 text-[13px] text-slate transition-colors hover:border-ink hover:text-ink"
        >
          Access status
        </Link>
      </nav>

      <section className="mt-8">
        {orders.length === 0 ? (
          <EmptyState
            symbol="Or"
            title="No orders yet"
            body="When you place an order it'll appear here with live status and tracking."
            action={
              <Link href="/products" className={buttonClass("primary")}>
                Start shopping
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-mist border-y border-mist">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <span>
                    <span className="font-medium group-hover:underline">{order.number}</span>
                    <span className="block text-[13px] text-slate">
                      {formatDate(order.createdAt)} · {order._count.items} item
                      {order._count.items === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-display text-[15px] font-bold tabular-nums">
                      {formatCents(order.totalCents)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
