import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { clearCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { buttonClass, ElementTile } from "@/components/ui";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/");

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  });
  if (!order) redirect("/");

  let paid = order.status !== "PENDING";
  if (!paid) {
    try {
      const stripeSession = await getStripe().checkout.sessions.retrieve(sessionId);
      paid = stripeSession.payment_status === "paid";
    } catch {
      paid = false;
    }
  }

  if (paid) await clearCart();

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="flex items-center gap-4">
        <ElementTile symbol="✓" size="lg" tone="ink" />
        <div>
          <h1 className="font-display text-2xl font-bold">
            {paid ? "Payment received" : "Almost there"}
          </h1>
          <p className="text-sm text-slate">Order {order.number}</p>
        </div>
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-slate">
        {paid
          ? `Thanks, your order is confirmed and a receipt is on its way to ${order.email}. We'll email again the moment it ships.`
          : "Your payment is still being confirmed by Stripe. This page will reflect the final status shortly, and you'll receive a confirmation email once it completes."}
      </p>

      <div className="mt-8 border border-mist bg-white p-5">
        <ul className="divide-y divide-mist text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium">{item.name}</span>
                <span className="block text-xs text-slate">
                  {item.variantLabel} × {item.quantity}
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
            <dt className="text-slate">Shipping ({order.shippingMethod})</dt>
            <dd className="tabular-nums">{formatCents(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between font-display text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {order.userId ? (
          <Link href={`/account/orders/${order.id}`} className={buttonClass("primary")}>
            Track this order
          </Link>
        ) : (
          <Link href="/register" className={buttonClass("primary")}>
            Create an account to track orders
          </Link>
        )}
        <Link href="/products" className={buttonClass("secondary")}>
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
