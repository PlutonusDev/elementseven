"use client";

import { useActionState, useState, useTransition } from "react";
import { estimateShippingAction } from "@/lib/actions/cart";
import { createCheckoutSessionAction } from "@/lib/actions/checkout";
import { formatCents } from "@/lib/format";
import { etaText, type ShippingOption } from "@/lib/shipping/types";
import { AU_STATES } from "@/lib/validation";
import { Alert, cx, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { EmbeddedPayment } from "@/components/store/embedded-payment";

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string | null;
  suburb: string;
  state: string;
  postcode: string;
  phone: string | null;
};

type Fields = {
  fullName: string;
  line1: string;
  line2: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
};

const EMPTY_FIELDS: Fields = {
  fullName: "",
  line1: "",
  line2: "",
  suburb: "",
  state: "NSW",
  postcode: "",
  phone: "",
};

export function CheckoutForm({
  defaultEmail,
  addresses,
}: {
  defaultEmail: string;
  addresses: SavedAddress[];
}) {
  const defaultAddress = addresses[0] ?? null;
  const [email, setEmail] = useState(defaultEmail);
  const [fields, setFields] = useState<Fields>(
    defaultAddress
      ? {
          fullName: defaultAddress.fullName,
          line1: defaultAddress.line1,
          line2: defaultAddress.line2 ?? "",
          suburb: defaultAddress.suburb,
          state: defaultAddress.state,
          postcode: defaultAddress.postcode,
          phone: defaultAddress.phone ?? "",
        }
      : EMPTY_FIELDS,
  );
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [optionId, setOptionId] = useState("");
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimating, startEstimate] = useTransition();
  const [state, formAction] = useActionState(createCheckoutSessionAction, null);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (key === "postcode") {
      setOptions(null);
      setOptionId("");
    }
  }

  function applySaved(id: string) {
    const address = addresses.find((a) => a.id === id);
    if (!address) return;
    setFields({
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? "",
      suburb: address.suburb,
      state: address.state,
      postcode: address.postcode,
      phone: address.phone ?? "",
    });
    setOptions(null);
    setOptionId("");
  }

  function fetchOptions() {
    setEstimateError(null);
    startEstimate(async () => {
      const result = await estimateShippingAction(fields.postcode);
      if (result.ok) {
        setOptions(result.options);
        setOptionId(result.options[0]?.id ?? "");
      } else {
        setOptions(null);
        setEstimateError(result.message);
      }
    });
  }

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Payment</h2>
          <a
            href="/checkout"
            className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
          >
            ← Edit order details
          </a>
        </div>
        <EmbeddedPayment clientSecret={state.clientSecret} />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-bold">Contact</h2>
        <div className="mt-4">
          <Label htmlFor="co-email">Email</Label>
          <Input
            id="co-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Shipping address</h2>
          {addresses.length > 0 && (
            <select
              aria-label="Use a saved address"
              defaultValue=""
              onChange={(e) => applySaved(e.target.value)}
              className="border border-mist bg-white px-2 py-1 text-[13px]"
            >
              <option value="">Saved addresses…</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}, {a.suburb} {a.postcode}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="co-name">Full name</Label>
            <Input
              id="co-name"
              name="fullName"
              autoComplete="name"
              required
              value={fields.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="co-line1">Street address</Label>
            <Input
              id="co-line1"
              name="line1"
              autoComplete="address-line1"
              required
              value={fields.line1}
              onChange={(e) => set("line1", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="co-line2">Apartment, unit, etc. (optional)</Label>
            <Input
              id="co-line2"
              name="line2"
              autoComplete="address-line2"
              value={fields.line2}
              onChange={(e) => set("line2", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="co-suburb">Suburb</Label>
            <Input
              id="co-suburb"
              name="suburb"
              autoComplete="address-level2"
              required
              value={fields.suburb}
              onChange={(e) => set("suburb", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="co-state">State</Label>
              <Select
                id="co-state"
                name="state"
                required
                value={fields.state}
                onChange={(e) => set("state", e.target.value)}
              >
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="co-postcode">Postcode</Label>
              <Input
                id="co-postcode"
                name="postcode"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                autoComplete="postal-code"
                required
                value={fields.postcode}
                onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="co-phone">Phone (optional)</Label>
            <Input
              id="co-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={fields.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Shipping method</h2>
        {!options && (
          <div className="mt-4">
            <button
              type="button"
              onClick={fetchOptions}
              disabled={estimating || fields.postcode.length !== 4}
              className="border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:border-nitro hover:text-nitro disabled:cursor-not-allowed disabled:opacity-40"
            >
              {estimating ? "Finding options…" : "Get shipping options"}
            </button>
            {estimateError && (
              <Alert tone="error" className="mt-3">
                {estimateError}
              </Alert>
            )}
          </div>
        )}
        {options && (
          <fieldset className="mt-4">
            <legend className="sr-only">Choose a shipping option</legend>
            <div className="space-y-2">
              {options.map((option) => (
                <label
                  key={option.id}
                  className={cx(
                    "flex cursor-pointer items-center justify-between gap-3 border bg-white px-4 py-3 transition-colors",
                    optionId === option.id ? "border-ink" : "border-mist hover:border-slate",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingOptionId"
                      value={option.id}
                      checked={optionId === option.id}
                      onChange={() => setOptionId(option.id)}
                      className="accent-ink"
                    />
                    <span className="text-sm">
                      {option.name}
                      <span className="block text-xs text-slate">{etaText(option)}</span>
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {option.priceCents === 0 ? "Free" : formatCents(option.priceCents)}
                  </span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={fetchOptions}
              disabled={estimating}
              className="mt-3 text-[13px] text-slate underline underline-offset-2 transition-colors hover:text-ink"
            >
              Re-estimate for this postcode
            </button>
          </fieldset>
        )}
      </section>

      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <div className="border-t border-mist pt-6">
        <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Starting secure checkout…" disabled={!optionId}>
          Continue to payment
        </SubmitButton>
      </div>
    </form>
  );
}
