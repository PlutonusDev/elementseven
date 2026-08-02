import Link from "next/link";
import type { Category } from "@prisma/client";
import { CATEGORIES } from "@/lib/catalog";
import { formatCents } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";
import { Badge, ElementTile } from "@/components/ui";

type Tone = "nitro" | "amber" | "ink";

const CATEGORY_ACCENT: Record<Category, { tone: Tone; color: string }> = {
  DISPOSABLES: { tone: "nitro", color: "var(--color-nitro)" },
  POD_SYSTEMS: { tone: "amber", color: "var(--color-amber)" },
  MODS: { tone: "ink", color: "var(--color-ink)" },
  E_LIQUIDS: { tone: "nitro", color: "var(--color-nitro)" },
  COILS_ACCESSORIES: { tone: "amber", color: "var(--color-amber)" },
  BULK: { tone: "ink", color: "var(--color-ink)" },
};

export function ProductCard({ product, locked = false }: { product: ProductCardData; locked?: boolean }) {
  const category = CATEGORIES[product.category];
  const accent = CATEGORY_ACCENT[product.category];
  const hasRange = product.minPriceCents !== product.maxPriceCents;

  return (
    <Link
      href={locked ? "/request-access" : `/products/${product.slug}`}
      className="card-lift group relative flex flex-col border-2 border-ink bg-white hover:card-lift-hover focus-visible:card-lift-hover"
    >
      {product.featured && !locked && (
        <span
          aria-hidden="true"
          className="absolute -top-2 -left-2 z-10 -rotate-6 border-2 border-ink bg-amber px-2 py-0.5 text-[11px] font-bold tracking-wide text-ink uppercase shadow-[2px_2px_0_0_var(--color-ink)]"
        >
          Staff pick
        </span>
      )}

      <div className="relative aspect-square overflow-hidden border-b-2 border-ink bg-[#f1f2ef]">
        {locked ? (
          <div className="lock-stripes grid h-full w-full place-items-center">
            <div className="flex flex-col items-center gap-2 border-2 border-ink bg-paper px-4 py-3 shadow-[3px_3px_0_0_var(--color-ink)] transition-transform duration-300 ease-snap group-hover:-translate-y-0.5">
              <span aria-hidden="true" className="text-xl">
                🔒
              </span>
              <span className="text-[11px] font-bold tracking-widest uppercase">
                Approval required
              </span>
            </div>
          </div>
        ) : product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-700 ease-snap group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate">
            <ElementTile symbol={category.symbol} size="lg" tone="ghost" />
          </div>
        )}
        <ElementTile
          symbol={category.symbol}
          index={category.index}
          size="sm"
          tone={accent.tone}
          className="absolute top-3 left-3"
        />
        {!product.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-[11px] font-medium tracking-widest text-paper uppercase">
            Sold out
          </div>
        )}
        {product.inStock && product.lowStockUnits !== null && (
          <div className="absolute right-2 bottom-2">
            <Badge tone="amber">Only {product.lowStockUnits} left</Badge>
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="h-1.5 w-full origin-left scale-x-100 transition-transform duration-500 ease-snap lg:scale-x-0 lg:group-hover:scale-x-100"
        style={{ background: accent.color }}
      />

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: accent.color }}>
          {product.brand}
        </p>
        <p className="mt-1 text-sm leading-snug font-medium group-hover:underline">
          {product.name}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          {locked ? (
            <p className="text-[13px] font-medium text-slate">Sign in &amp; get approved to view</p>
          ) : (
            <p className="font-display text-xl font-black tabular-nums">
              {hasRange && <span className="mr-1 text-xs font-normal text-slate">from</span>}
              {formatCents(product.minPriceCents)}
            </p>
          )}
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-ink bg-white text-sm font-bold text-ink transition-all duration-300 ease-snap group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-paper"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col border border-mist bg-white">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-6 w-20" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  locked = false,
}: {
  products: ProductCardData[];
  locked?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} locked={locked} />
      ))}
    </div>
  );
}
