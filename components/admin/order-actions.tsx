"use client";

import { useActionState, useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { transitionOrderAction } from "@/lib/actions/admin/orders";
import { CARRIERS, ORDER_TRANSITIONS, STATUS_LABELS } from "@/lib/orders";
import { Alert, Button, cx, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const CARRIER_OPTIONS = Object.entries(CARRIERS).map(([value, c]) => ({ value, name: c.name }));

const TRANSITION_STYLE: Partial<Record<OrderStatus, "primary" | "danger" | "secondary">> = {
  PROCESSING: "primary",
  SHIPPED: "primary",
  DELIVERED: "primary",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, formAction] = useActionState(transitionOrderAction, null);
  const [selected, setSelected] = useState<OrderStatus | null>(null);
  const next = ORDER_TRANSITIONS[status];

  if (next.length === 0) {
    return (
      <p className="text-[13px] text-slate">
        No further actions, this order is {STATUS_LABELS[status].toLowerCase()}.
      </p>
    );
  }

  const needsTracking = selected === "SHIPPED";
  const isDestructive = selected === "CANCELLED" || selected === "REFUNDED";

  return (
    <div>
      {selected === null ? (
        <div className="flex flex-wrap gap-2">
          {next.map((to) => (
            <Button
              key={to}
              type="button"
              variant={TRANSITION_STYLE[to] ?? "secondary"}
              size="sm"
              onClick={() => setSelected(to)}
            >
              {to === "PROCESSING" && "Mark processing"}
              {to === "SHIPPED" && "Mark shipped"}
              {to === "DELIVERED" && "Mark delivered"}
              {to === "CANCELLED" && "Cancel order"}
              {to === "REFUNDED" && "Refund order"}
            </Button>
          ))}
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="to" value={selected} />

          {needsTracking && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="oa-carrier">Carrier</Label>
                <select
                  id="oa-carrier"
                  name="carrier"
                  required
                  defaultValue=""
                  className="w-full border border-mist bg-white px-3 py-2 text-sm focus:border-ink"
                >
                  <option value="" disabled>
                    Select carrier…
                  </option>
                  {CARRIER_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="oa-tracking">Tracking number</Label>
                <input
                  id="oa-tracking"
                  name="trackingNumber"
                  required
                  className="w-full border border-mist bg-white px-3 py-2 text-sm focus:border-ink"
                />
              </div>
              <p className="text-xs text-slate sm:col-span-2">
                Marking shipped emails the customer their tracking link.
              </p>
            </div>
          )}

          {isDestructive && (
            <p className={cx("text-[13px]", selected === "REFUNDED" ? "text-alert" : "text-slate")}>
              {selected === "REFUNDED"
                ? "This issues a full refund via Stripe and cannot be undone."
                : "This cancels the order and releases any reserved stock."}
            </p>
          )}

          <div className="flex items-center gap-3">
            <SubmitButton
              variant={TRANSITION_STYLE[selected] === "danger" ? "danger" : "primary"}
              size="sm"
              pendingText="Working…"
            >
              Confirm: {STATUS_LABELS[selected]}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-3">
          {state.message}
        </Alert>
      )}
    </div>
  );
}
