import type { Metadata } from "next";
import Link from "next/link";
import { getCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { getStoreSettings } from "@/lib/settings";
import { CartLineControls } from "@/components/store/cart-line-controls";
import { ShippingEstimator } from "@/components/store/shipping-estimator";
import { buttonClass, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getStoreSettings()]);

  if (cart.lines.length === 0) {
    return (
      <div className="py-16">
        <h1 className="font-display text-3xl font-black tracking-tight">Cart</h1>
        <div className="mt-8">
          <EmptyState
            symbol="Ct"
            title="Your cart is empty"
            body="Everything you add ends up here, devices, liquids, coils, the lot."
            action={
              <Link href="/products" className={buttonClass("primary")}>
                Browse the range
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const remaining = settings.freeShippingThresholdCents - cart.subtotalCents;

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-black tracking-tight">Cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-mist border-y border-mist">
          {cart.lines.map((line) => (
            <li key={line.itemId} className="flex gap-4 py-5">
              <Link
                href={`/products/${line.slug}`}
                className="block h-24 w-24 shrink-0 overflow-hidden border border-mist bg-[#f1f2ef]"
              >
                {line.imageUrl && (
                  <img
                    src={line.imageUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/products/${line.slug}`} className="truncate text-sm font-medium hover:underline">
                    {line.name}
                  </Link>
                  <p className="font-display text-[15px] font-bold tabular-nums">
                    {formatCents(line.unitPriceCents * line.quantity)}
                  </p>
                </div>
                <p className="mt-0.5 text-[13px] text-slate">
                  {line.variantLabel} · {formatCents(line.unitPriceCents)} each
                </p>
                {line.available < line.quantity && (
                  <p className="mt-1 text-xs font-medium text-alert">
                    Only {line.available} left in stock, reduce the quantity to check out.
                  </p>
                )}
                <div className="mt-auto pt-3">
                  <CartLineControls
                    itemId={line.itemId}
                    quantity={line.quantity}
                    available={line.available}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-mist bg-white p-5">
          <h2 className="font-display text-lg font-bold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Subtotal ({cart.itemCount} items)</dt>
              <dd className="font-medium tabular-nums">{formatCents(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Shipping</dt>
              <dd className="text-slate">Calculated at checkout</dd>
            </div>
          </dl>

          {settings.freeShippingThresholdCents > 0 && (
            <p className="mt-4 border border-mist bg-paper px-3 py-2 text-[13px]">
              {remaining > 0 ? (
                <>
                  Add <span className="font-medium">{formatCents(remaining)}</span> more for free
                  standard shipping.
                </>
              ) : (
                <span className="font-medium">This order qualifies for free standard shipping.</span>
              )}
            </p>
          )}

          <div className="mt-5">
            <ShippingEstimator />
          </div>

          <Link href="/checkout" className={buttonClass("primary", "lg") + " mt-6 w-full"}>
            Checkout
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-[13px] text-slate underline-offset-2 hover:text-ink hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
