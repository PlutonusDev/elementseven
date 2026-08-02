"use client";

import { useState, useTransition } from "react";
import { estimateShippingAction, type ShippingEstimate } from "@/lib/actions/cart";
import { etaText } from "@/lib/shipping/types";
import { formatCents } from "@/lib/format";
import { Input } from "@/components/ui";

export function ShippingEstimator() {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<ShippingEstimate | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-t border-mist pt-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setResult(await estimateShippingAction(postcode));
          });
        }}
      >
        <label htmlFor="estimate-postcode" className="text-[13px] font-medium">
          Estimate shipping
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id="estimate-postcode"
            inputMode="numeric"
            maxLength={4}
            placeholder="Postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ""))}
            className="w-28"
          />
          <button
            type="submit"
            disabled={pending || postcode.length !== 4}
            className="border border-ink px-4 text-[13px] font-medium transition-colors hover:border-nitro hover:text-nitro disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Checking…" : "Estimate"}
          </button>
        </div>
      </form>

      {result && !result.ok && (
        <p role="status" className="mt-2 text-xs text-alert">
          {result.message}
        </p>
      )}
      {result?.ok && (
        <ul className="mt-3 space-y-1.5" aria-label="Shipping options">
          {result.options.map((option) => (
            <li key={option.id} className="flex items-baseline justify-between gap-2 text-[13px]">
              <span>
                {option.name}
                <span className="ml-1.5 text-slate">{etaText(option)}</span>
              </span>
              <span className="font-medium tabular-nums">
                {option.priceCents === 0 ? "Free" : formatCents(option.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
