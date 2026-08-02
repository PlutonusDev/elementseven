"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addToCartAction } from "@/lib/actions/cart";
import { stockStatus } from "@/lib/catalog";
import { formatCents } from "@/lib/format";
import { Alert, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export type PickerVariant = {
  id: string;
  flavour: string | null;
  strengthMg: number | null;
  priceCents: number | null;
  available: number;
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function VariantPicker({
  basePriceCents,
  axisLabel,
  variants,
}: {
  basePriceCents: number;
  axisLabel: string;
  variants: PickerVariant[];
}) {
  const flavours = useMemo(
    () => unique(variants.map((v) => v.flavour).filter((f): f is string => f !== null)),
    [variants],
  );
  const strengths = useMemo(
    () => unique(variants.map((v) => v.strengthMg).filter((s): s is number => s !== null)),
    [variants],
  );

  const firstPick =
    variants.find((v) => v.available > 0) ?? variants[0] ?? null;
  const [flavour, setFlavour] = useState<string | null>(firstPick?.flavour ?? null);
  const [strength, setStrength] = useState<number | null>(firstPick?.strengthMg ?? null);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction] = useActionState(addToCartAction, null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setJustAdded(true);
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const current =
    variants.find(
      (v) =>
        (flavours.length === 0 || v.flavour === flavour) &&
        (strengths.length === 0 || v.strengthMg === strength),
    ) ?? null;

  const available = current?.available ?? 0;
  const status = stockStatus(available);
  const priceCents = current ? (current.priceCents ?? basePriceCents) : basePriceCents;
  const maxQty = Math.min(available, 99);

  function availabilityFor(f: string | null, s: number | null): number {
    const v = variants.find(
      (variant) =>
        (flavours.length === 0 || variant.flavour === f) &&
        (strengths.length === 0 || variant.strengthMg === s),
    );
    return v?.available ?? -1;
  }

  function pillClass(selected: boolean, stock: number): string {
    return cx(
      "border px-3 py-2 text-[13px] font-medium transition-colors",
      selected ? "border-ink bg-ink text-paper" : "border-mist bg-white hover:border-ink",
      stock === 0 && !selected && "text-slate line-through decoration-slate/60",
      stock < 0 && "cursor-not-allowed opacity-35",
    );
  }

  return (
    <div>
      <p aria-live="polite">
        <span className="inline-block border-2 border-ink bg-amber px-3 py-1 font-display text-3xl font-black text-ink tabular-nums shadow-[3px_3px_0_0_var(--color-ink)]">
          {formatCents(priceCents)}
        </span>
      </p>

      {flavours.length > 0 && (
        <fieldset className="mt-6">
          <legend className="text-[13px] font-medium">{axisLabel}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {flavours.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFlavour(f)}
                aria-pressed={flavour === f}
                className={pillClass(
                  flavour === f,
                  strengths.length ? Math.max(...strengths.map((s) => availabilityFor(f, s))) : availabilityFor(f, null),
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {strengths.length > 0 && (
        <fieldset className="mt-5">
          <legend className="text-[13px] font-medium">Nicotine strength</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {strengths.map((s) => {
              const stock = availabilityFor(flavour, s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrength(s)}
                  disabled={stock < 0}
                  aria-pressed={strength === s}
                  className={pillClass(strength === s, stock)}
                >
                  {s}mg
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p
        className={cx(
          "mt-5 text-sm font-medium",
          status.tone === "in" && "text-ink",
          status.tone === "low" && "text-nitro",
          status.tone === "out" && "text-slate",
        )}
        role="status"
      >
        {current ? status.label : "Select an option"}
      </p>

      <form action={formAction} className="mt-4 flex flex-wrap items-stretch gap-3">
        <input type="hidden" name="variantId" value={current?.id ?? ""} />
        <div className="flex items-center border border-mist bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="px-3.5 py-2.5 text-lg leading-none transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(maxQty, 1), q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Increase quantity"
            className="px-3.5 py-2.5 text-lg leading-none transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            +
          </button>
        </div>
        <input type="hidden" name="quantity" value={quantity} />
        <SubmitButton
          variant={justAdded ? "amber" : "primary"}
          className="flex-1 sm:flex-none sm:px-10"
          pendingText="Adding…"
          disabled={!current || available === 0}
        >
          {available === 0 ? "Out of stock" : justAdded ? "Added to cart ✓" : "Add to cart"}
        </SubmitButton>
      </form>

      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-3">
          {state.message}
        </Alert>
      )}
    </div>
  );
}
