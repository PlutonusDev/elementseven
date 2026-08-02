import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCents, formatDateTime } from "@/lib/format";
import { carrierName, trackingUrlFor } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { StatusTimeline } from "@/components/store/status-timeline";
import { OrderActions } from "@/components/admin/order-actions";
import { AdminCard, AdminPageHeader, Td, Th } from "@/components/admin/ui";
import { Alert } from "@/components/ui";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) notFound();

  const trackingUrl = trackingUrlFor(order.carrier, order.trackingNumber);

  return (
    <div>
      <AdminPageHeader
        title={`Order ${order.number}`}
        description={formatDateTime(order.createdAt)}
        actions={
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <Link href="/admin/orders" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              ← Orders
            </Link>
          </div>
        }
      />

      {order.paymentError && (
        <Alert tone="error" className="mb-4">
          Last payment error: {order.paymentError}
        </Alert>
      )}
      {order.internalNote && (
        <Alert tone="info" className="mb-4">
          {order.internalNote}
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Progress</h2>
            <div className="mt-4">
              <StatusTimeline order={order} />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-mist px-4 py-3">
              <h2 className="font-display text-sm font-bold">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th>SKU</Th>
                    <Th className="text-right">Unit</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Line</Th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        <span className="font-medium">{item.name}</span>
                        <span className="block text-xs text-slate">{item.variantLabel}</span>
                      </Td>
                      <Td className="font-mono text-xs text-slate">{item.sku}</Td>
                      <Td className="text-right tabular-nums">{formatCents(item.unitPriceCents)}</Td>
                      <Td className="text-right tabular-nums">{item.quantity}</Td>
                      <Td className="text-right tabular-nums font-medium">
                        {formatCents(item.unitPriceCents * item.quantity)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 border-t border-mist px-4 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate">Subtotal</span>
                <span className="tabular-nums">{formatCents(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Shipping ({order.shippingMethod})</span>
                <span className="tabular-nums">{formatCents(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between font-display text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCents(order.totalCents)}</span>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Actions</h2>
            <p className="mt-1 text-xs text-slate">Only legal status transitions are shown.</p>
            <div className="mt-3">
              <OrderActions orderId={order.id} status={order.status} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Customer</h2>
            <p className="mt-2 text-[13px]">{order.email}</p>
            {order.user ? (
              <p className="text-xs text-slate">
                Account: {order.user.name ?? order.user.email}
              </p>
            ) : (
              <p className="text-xs text-slate">Guest checkout</p>
            )}
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Shipping address</h2>
            <address className="mt-2 text-[13px] leading-relaxed text-slate not-italic">
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
            {order.trackingNumber && (
              <p className="mt-3 border-t border-mist pt-3 text-[13px]">
                {carrierName(order.carrier)}:{" "}
                {trackingUrl ? (
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-nitro underline underline-offset-2">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="font-medium">{order.trackingNumber}</span>
                )}
              </p>
            )}
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Payment</h2>
            <dl className="mt-2 space-y-1 text-xs text-slate">
              <div className="flex justify-between gap-2">
                <dt>Payment intent</dt>
                <dd className="truncate font-mono">{order.stripePaymentIntentId ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Session</dt>
                <dd className="truncate font-mono">{order.stripeSessionId ?? "—"}</dd>
              </div>
            </dl>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
