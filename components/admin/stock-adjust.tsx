"use client";

import { useActionState } from "react";
import { adjustStockAction } from "@/lib/actions/admin/stock";
import { Alert, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const REASONS = [
  { value: "RECEIVED", label: "Stock received" },
  { value: "ADJUSTMENT", label: "Manual adjustment" },
  { value: "CORRECTION", label: "Count correction" },
  { value: "DAMAGED", label: "Damaged / write-off" },
  { value: "REFUND_RESTOCK", label: "Refund restock" },
] as const;

export function StockAdjust({ variantId, compact = false }: { variantId: string; compact?: boolean }) {
  const [state, formAction] = useActionState(adjustStockAction, null);
  const field = "border border-mist bg-white px-2 py-1 text-[13px] focus:border-ink";

  return (
    <div>
      <form action={formAction} className={cx("flex flex-wrap items-end gap-2", compact && "gap-1.5")}>
        <input type="hidden" name="variantId" value={variantId} />
        <div>
          {!compact && <label className="mb-1 block text-[11px] text-slate">Delta</label>}
          <input
            name="delta"
            inputMode="numeric"
            required
            placeholder="±0"
            aria-label="Stock change"
            className={cx(field, "w-16 text-right tabular-nums")}
          />
        </div>
        <div>
          {!compact && <label className="mb-1 block text-[11px] text-slate">Reason</label>}
          <select name="reason" required aria-label="Reason" className={field} defaultValue="ADJUSTMENT">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className={cx(compact ? "hidden" : "block")}>
          <label className="mb-1 block text-[11px] text-slate">Note (optional)</label>
          <input name="note" maxLength={200} className={cx(field, "w-48")} placeholder="Reference…" />
        </div>
        {compact && <input type="hidden" name="note" value="" />}
        <SubmitButton size="sm" pendingText="…">
          Apply
        </SubmitButton>
      </form>
      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-2">
          {state.message}
        </Alert>
      )}
    </div>
  );
}
