import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatCents, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { StatusTimeline } from "@/components/store/status-timeline";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser(`/account/orders/${id}`);

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl py-10">
      <Link href="/account" className="text-[13px] text-slate hover:text-ink">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Order {order.number}</h1>
          <p className="mt-1 text-sm text-slate">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="mt-8 border border-mist bg-white p-5 sm:p-6" aria-label="Order progress">
        <StatusTimeline order={order} />
      </section>

      <section className="mt-6 border border-mist bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Items</h2>
        <ul className="mt-3 divide-y divide-mist text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3">
              <span>
                {item.productSlug ? (
                  <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
                <span className="block text-xs text-slate">
                  {item.variantLabel} · SKU {item.sku} · {formatCents(item.unitPriceCents)} ×{" "}
                  {item.quantity}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {formatCents(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-mist pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate">Shipping ({order.shippingMethod})</dt>
            <dd className="tabular-nums">{formatCents(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between font-display text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 border border-mist bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Shipping address</h2>
        <address className="mt-2 text-sm leading-relaxed text-slate not-italic">
          {order.shipName}
          <br />
          {order.shipLine1}
          {order.shipLine2 && (
            <>
              <br />
              {order.shipLine2}
            </>
          )}
          <br />
          {order.shipSuburb} {order.shipState} {order.shipPostcode}
          {order.shipPhone && (
            <>
              <br />
              {order.shipPhone}
            </>
          )}
        </address>
      </section>
    </div>
  );
}
