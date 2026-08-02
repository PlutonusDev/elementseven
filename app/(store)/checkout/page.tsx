import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccess, isApproved } from "@/lib/access";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const access = await getAccess();
  if (!isApproved(access)) redirect("/request-access");

  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/cart");

  const session = await auth();
  const addresses = session?.user?.id
    ? await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { label: "asc" }],
      })
    : [];

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-black tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <CheckoutForm
          defaultEmail={session?.user?.email ?? ""}
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            fullName: a.fullName,
            line1: a.line1,
            line2: a.line2,
            suburb: a.suburb,
            state: a.state,
            postcode: a.postcode,
            phone: a.phone,
          }))}
        />

        <aside className="order-first h-fit border border-mist bg-white p-5 lg:order-none">
          <h2 className="font-display text-lg font-bold">Your order</h2>
          <ul className="mt-4 divide-y divide-mist text-sm">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{line.name}</span>
                  <span className="text-xs text-slate">
                    {line.variantLabel} × {line.quantity}
                  </span>
                </span>
                <span className="font-medium tabular-nums">
                  {formatCents(line.unitPriceCents * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-mist pt-3 text-sm">
            <span className="text-slate">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCents(cart.subtotalCents)}</span>
          </div>
          <p className="mt-1 text-xs text-slate">Shipping added at the next step.</p>
        </aside>
      </div>
    </div>
  );
}
