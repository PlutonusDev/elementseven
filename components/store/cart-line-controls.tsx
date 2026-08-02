"use client";

import { useActionState } from "react";
import { removeCartItemAction, updateCartItemAction } from "@/lib/actions/cart";
import { cx } from "@/components/ui";

export function CartLineControls({
  itemId,
  quantity,
  available,
}: {
  itemId: string;
  quantity: number;
  available: number;
}) {
  const [state, formAction, pending] = useActionState(updateCartItemAction, null);
  const maxQty = Math.min(available, 99);

  return (
    <div>
      <div className="flex items-center gap-3">
        <form action={formAction} className="flex items-center border border-mist bg-white">
          <input type="hidden" name="itemId" value={itemId} />
          <button
            type="submit"
            name="quantity"
            value={quantity - 1}
            disabled={pending}
            aria-label="Decrease quantity"
            className="px-3 py-1.5 text-base leading-none transition-colors hover:text-nitro disabled:opacity-35"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button
            type="submit"
            name="quantity"
            value={quantity + 1}
            disabled={pending || quantity >= maxQty}
            aria-label="Increase quantity"
            className="px-3 py-1.5 text-base leading-none transition-colors hover:text-nitro disabled:opacity-35"
          >
            +
          </button>
        </form>

        <form action={removeCartItemAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <button
            type="submit"
            className="text-[13px] text-slate underline-offset-2 transition-colors hover:text-alert hover:underline"
          >
            Remove
          </button>
        </form>
      </div>

      {state?.message && (
        <p
          role="status"
          className={cx("mt-1.5 text-xs", state.ok ? "text-slate" : "text-alert")}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
