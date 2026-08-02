import Link from "next/link";
import { getAccess, isApproved } from "@/lib/access";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { CARD_INCLUDE, toCardData } from "@/lib/products";
import { getStoreSettings } from "@/lib/settings";
import { ProductGrid } from "@/components/store/product-card";
import { buttonClass, ElementTile } from "@/components/ui";

export default async function HomePage() {
  const [featuredRaw, counts, brands, settings, access] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, featured: true },
      include: CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.product.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { published: true },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    getStoreSettings(),
    getAccess(),
  ]);

  const locked = !isApproved(access);
  const featured = featuredRaw.map(toCardData);
  const collageImages = locked ? [] : featured.filter((p) => p.imageUrl).slice(0, 3);
  const countFor = (category: string) =>
    counts.find((c) => c.category === category)?._count._all ?? 0;

  return (
    <div className="pb-8">
      <section className="full-bleed relative flex min-h-[34rem] items-center overflow-hidden bg-ink text-paper lg:min-h-[calc(100svh-6.25rem)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 120% at 15% 0%, #2e45ff 0%, #1a1f6b 38%, #17191c 72%)",
          }}
        />
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.09] invert" />
        <div
          aria-hidden="true"
          className="absolute -top-10 right-0 h-72 w-72 translate-x-1/4 rotate-12 bg-amber/80 blur-2xl sm:h-[28rem] sm:w-[28rem]"
          style={{ clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/4 translate-y-1/4 bg-nitro/50 blur-2xl sm:h-80 sm:w-80"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="max-w-xl font-display text-5xl leading-[0.95] font-black tracking-tight sm:text-6xl">
              Massive Puffs.
              <br />
              <span className="text-outline-paper text-amber">Unrivaled Flavour.</span>
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/75">
              Ditch the messy refills and burnt coils. From pocket-sized 9K ingots to powerhouse 50K puff monsters, we stock the longest-lasting, hardest-hitting disposables on the market. 100% authentic, lab-verified, and ready to vape.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/products" className={buttonClass("amber", "lg")}>
                Shop the range →
              </Link>
              <Link
                href="/products?category=POD_SYSTEMS"
                className="inline-flex items-center justify-center border-2 border-paper px-7 py-3.5 text-base font-medium text-paper transition-all hover:-translate-y-0.5 hover:border-amber hover:text-amber"
              >
                Pod systems
              </Link>
            </div>
            {settings.freeShippingThresholdCents > 0 && (
              <p className="mt-7 text-[13px] font-medium text-paper/70">
                <span className="[filter:brightness(0)_invert(1)]">🔥</span> Free shipping on orders over{" "}
                <span className="text-amber">{formatCents(settings.freeShippingThresholdCents)}</span>
              </p>
            )}
          </div>

          <div aria-hidden="true" className="relative hidden h-96 lg:block">
            {locked && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid grid-cols-2 gap-4">
                  {["Dp", "Pd", "Lq", "🔒"].map((symbol, i) => (
                    <span
                      key={symbol}
                      className={`flex h-28 w-28 items-center justify-center border-2 border-ink font-display text-2xl font-black shadow-[5px_5px_0_0_var(--color-ink)] ${
                        i === 3 ? "rotate-3 bg-amber text-ink" : i % 2 ? "-rotate-2 bg-paper text-ink" : "rotate-2 bg-nitro text-paper"
                      }`}
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {collageImages[0] && (
              <img
                src={collageImages[0].imageUrl!}
                alt=""
                className="card-lift-hover absolute top-4 left-6 h-44 w-44 -rotate-6 border-2 border-ink bg-white object-cover shadow-[6px_6px_0_0_var(--color-amber)]"
              />
            )}
            {collageImages[1] && (
              <img
                src={collageImages[1].imageUrl!}
                alt=""
                className="card-lift-hover absolute top-28 right-4 h-48 w-48 rotate-6 border-2 border-ink bg-white object-cover shadow-[6px_6px_0_0_var(--color-paper)]"
              />
            )}
            {collageImages[2] && (
              <img
                src={collageImages[2].imageUrl!}
                alt=""
                className="card-lift-hover absolute bottom-2 left-28 h-40 w-40 rotate-3 border-2 border-ink bg-white object-cover shadow-[6px_6px_0_0_var(--color-nitro)]"
              />
            )}
            <span className="absolute right-12 bottom-0 inline-flex h-14 w-14 -rotate-6 items-center justify-center border-2 border-ink bg-amber font-display text-lg font-black text-ink shadow-[4px_4px_0_0_var(--color-paper)]">
              18+
            </span>
          </div>
        </div>
        <p className="absolute bottom-6 right-8 text-sm font-medium text-paper/50">
          <span className="[filter:brightness(0)_invert(1)]">🦘</span> Proudly Australian-owned and operated!
        </p>
      </section>

      <section className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="inline-block -rotate-1 border-2 border-ink bg-amber px-2 py-0.5 text-[11px] font-bold tracking-widest text-ink uppercase">
              This week
            </span>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight">
              Staff <span className="text-nitro">picks</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="shrink-0 border-b-2 border-ink pb-0.5 text-sm font-medium text-ink transition-colors hover:border-nitro hover:text-nitro"
          >
            View all →
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={featured} locked={locked} />
        </div>
      </section>

      <section className="full-bleed relative my-4 overflow-hidden border-y-2 border-ink bg-amber">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { tile: "01", title: "No Counterfeits", body: "If we receive counterfeit products, we reject them." },
            { tile: "02", title: "Same-day dispatch", body: "Order before 2pm AEST, it ships today." },
            { tile: "03", title: "Wholesale Pricing", body: "Competitive prices for bulk orders." },
            { tile: "04", title: "Secure checkout", body: "Card payments handled by Stripe. We don't store your payment information." },
          ].map((item) => (
            <div key={item.tile} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-paper font-display text-sm font-black text-ink">
                {item.tile}
              </span>
              <div>
                <p className="font-display text-base font-bold text-ink">{item.title}</p>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-ink/70">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <h2 className="font-display text-3xl font-black tracking-tight">
          Shop by <span className="text-nitro">category</span>
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {CATEGORY_ORDER.map((category, i) => {
            const meta = CATEGORIES[category];
            const tone = (["nitro", "amber", "ink", "ghost", "nitro"] as const)[i % 5];
            return (
              <Link
                key={category}
                href={`/products?category=${category}`}
                className="card-lift group flex flex-col gap-4 border-2 border-ink bg-white p-4 hover:card-lift-hover"
              >
                <ElementTile symbol={meta.symbol} index={meta.index} size="md" tone={tone} />
                <div>
                  <p className="text-sm font-medium group-hover:underline">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-slate tabular-nums">
                    {countFor(category)} products
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t-2 border-ink py-10">
        <p className="text-xs font-semibold tracking-widest text-slate uppercase">
          Brands we stand behind
        </p>
        <ul className="mt-5 flex flex-wrap items-baseline gap-x-10 gap-y-3">
          {brands.map((b) => (
            <li key={b.brand}>
              <Link
                href={`/products?brand=${encodeURIComponent(b.brand)}`}
                className="inline-block font-display text-lg font-bold text-slate/70 transition-transform hover:-translate-y-0.5 hover:text-nitro"
              >
                {b.brand}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
