import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";

const NAV = [
  { href: "/products", label: "Shop all" },
  { href: "/products?category=DISPOSABLES", label: "Disposables" },
  { href: "/products?category=POD_SYSTEMS", label: "Pod systems" },
  { href: "/products?category=E_LIQUIDS", label: "E-liquids" },
  { href: "/products?category=COILS_ACCESSORIES", label: "Coils & more" },
  { href: "/products?category=BULK", label: "Bulk" },
];

export async function StoreHeader() {
  const [session, cart] = await Promise.all([auth(), getCart()]);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.png" alt="Element Seven Logo" className="h-[40px]" />
        </Link>

        <nav aria-label="Store" className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate transition-colors hover:text-nitro"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-sm">
          <Link href={session?.user ? "/account" : "/login"} className="font-medium text-slate transition-colors hover:text-nitro">
            {session?.user ? "Account" : "Sign in"}
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 border-2 border-ink bg-ink px-3 py-1.5 font-medium text-paper transition-colors hover:bg-nitro"
          >
            Cart
            <span
              aria-label={`${cart.itemCount} items in cart`}
              className="inline-flex h-5 min-w-5 items-center justify-center border-2 border-ink bg-amber px-1 font-display text-[11px] font-bold text-ink tabular-nums"
            >
              {cart.itemCount}
            </span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Store categories"
        className="flex gap-5 overflow-x-auto border-t border-mist px-4 py-2 lg:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-[13px] whitespace-nowrap text-slate transition-colors hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
