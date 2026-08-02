import { formatDateTime } from "@/lib/format";
import { carrierName, trackingUrlFor } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";
import { Alert, cx, ElementTile } from "@/components/ui";

export type TimelineOrder = {
  status: OrderStatus;
  paidAt: Date | null;
  processingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  refundedAt: Date | null;
  trackingNumber: string | null;
  carrier: string | null;
};

export function StatusTimeline({ order }: { order: TimelineOrder }) {
  const terminal = order.status === "CANCELLED" || order.status === "REFUNDED";
  const steps = [
    { label: "Paid", symbol: "Pa", at: order.paidAt },
    { label: "Processing", symbol: "Pr", at: order.processingAt },
    { label: "Shipped", symbol: "Sh", at: order.shippedAt },
    { label: "Delivered", symbol: "De", at: order.deliveredAt },
  ];
  const currentIndex = steps.findIndex((s) => !s.at);
  const trackingUrl = trackingUrlFor(order.carrier, order.trackingNumber);

  return (
    <div>
      {order.status === "PENDING" && (
        <Alert tone="info" className="mb-5">
          Awaiting payment confirmation, this usually takes under a minute.
        </Alert>
      )}
      {order.status === "CANCELLED" && (
        <Alert tone="error" className="mb-5">
          This order was cancelled
          {order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ""}. You have not been
          charged, or any charge has been refunded.
        </Alert>
      )}
      {order.status === "REFUNDED" && (
        <Alert tone="info" className="mb-5">
          This order was refunded
          {order.refundedAt ? ` on ${formatDateTime(order.refundedAt)}` : ""}. Funds usually appear
          within 5–10 business days.
        </Alert>
      )}

      <ol className="grid grid-cols-4">
        {steps.map((step, i) => {
          const complete = Boolean(step.at);
          const isCurrent = !terminal && i === currentIndex;
          return (
            <li key={step.label} className="relative flex flex-col items-center gap-2 text-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute top-4 left-[-50%] h-0.5 w-full",
                    steps[i - 1].at ? "bg-ink" : "bg-mist",
                  )}
                />
              )}
              <ElementTile
                symbol={step.symbol}
                index={i + 1}
                size="sm"
                tone={complete ? "ink" : isCurrent ? "nitro" : "ghost"}
                className="relative z-10"
              />
              <div className="px-1">
                <p className={cx("text-xs font-medium", !complete && !isCurrent && "text-slate")}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-slate">
                  {step.at ? formatDateTime(step.at) : isCurrent ? "In progress" : "—"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {order.shippedAt && order.trackingNumber && (
        <p className="mt-5 border-t border-mist pt-4 text-sm">
          {carrierName(order.carrier)} tracking:{" "}
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-nitro underline underline-offset-2"
            >
              {order.trackingNumber}
            </a>
          ) : (
            <span className="font-medium">{order.trackingNumber}</span>
          )}
        </p>
      )}
    </div>
  );
}
