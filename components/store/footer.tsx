import Link from "next/link";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/settings";

export async function StoreFooter() {
  const settings = await getStoreSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden border-t-2 border-ink text-paper">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 140% at 85% 0%, #2e45ff 0%, #1a1f6b 40%, #17191c 75%)",
        }}
      />
      <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.07] invert" />

      <div className="relative">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo-white.png" alt="Element Seven Logo" className="h-[60px]" />
            </div>
          </div>

          <nav aria-label="Shop">
            <p className="text-xs font-semibold tracking-widest text-amber uppercase">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              {CATEGORY_ORDER.map((category) => (
                <li key={category}>
                  <Link
                    href={`/products?category=${category}`}
                    className="text-paper/70 transition-colors hover:text-amber"
                  >
                    {CATEGORIES[category].label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <p className="text-xs font-semibold tracking-widest text-amber uppercase">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/account" className="text-paper/70 transition-colors hover:text-amber">Orders</Link></li>
              <li><Link href="/account/addresses" className="text-paper/70 transition-colors hover:text-amber">Addresses</Link></li>
              <li><Link href="/account/preferences" className="text-paper/70 transition-colors hover:text-amber">Email preferences</Link></li>
              <li><Link href="/cart" className="text-paper/70 transition-colors hover:text-amber">Cart</Link></li>
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold tracking-widest text-amber uppercase">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-paper/70">
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="transition-colors hover:text-amber">
                  {settings.contactEmail}
                </a>
              </li>
              <li>Mon–Fri, 9am–5pm AEST</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-paper/15">
          <div className="mx-auto max-w-6xl px-4 py-6 text-[11px] leading-relaxed text-paper/55">
            <p className="font-medium text-paper/85">
              WARNING: This product contains nicotine. Nicotine is an addictive chemical.
            </p>
            <p>
              Sales restricted to adults 18+. Keep all products out of reach of children and pets. If
              you experience adverse effects, discontinue use and consult a medical professional.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
              <span>© {year} {settings.storeName}.</span>
              <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-amber">
                Terms of Service
              </Link>
              <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-amber">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
