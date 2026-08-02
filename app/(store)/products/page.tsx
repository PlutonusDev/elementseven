import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAccess, isApproved } from "@/lib/access";
import { CATEGORIES } from "@/lib/catalog";
import {
  CATALOG_SORTS,
  catalogFacets,
  parseCatalogParams,
  queryCatalog,
  type CatalogSort,
} from "@/lib/products";
import { CatalogFilters } from "@/components/store/catalog-filters";
import { ProductGrid } from "@/components/store/product-card";
import { buttonClass, cx, ElementTile, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop Vapes Online",
  description:
    "Browse disposable vapes, pod systems, mods, e-liquids and bulk packs. Fast shipping Australia-wide for approved adult customers.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function qs(sp: SearchParams, patch: Record<string, string | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page") continue;
    for (const v of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, v);
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    params.delete(key);
    if (value !== null) params.set(key, value);
  }
  const s = params.toString();
  return s ? `/products?${s}` : "/products";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseCatalogParams(sp);
  const [{ products, total, pageSize }, facets, access] = await Promise.all([
    queryCatalog(filters),
    catalogFacets(),
    getAccess(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const locked = !isApproved(access);

  const activeCategory = filters.categories.length === 1 ? filters.categories[0] : null;
  const activeBrand = filters.brands.length === 1 ? filters.brands[0] : null;
  const bandTile = activeCategory ? CATEGORIES[activeCategory] : null;
  const bandTitle = activeCategory ? CATEGORIES[activeCategory].label : (activeBrand ?? "Shop all");

  return (
    <>
      <section
        className="full-bleed relative overflow-hidden border-b-2 border-ink text-paper"
        style={{
          background: "radial-gradient(120% 160% at 18% 0%, #2e45ff 0%, #1a1f6b 45%, #17191c 82%)",
        }}
      >
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.08] invert" />
        <div
          aria-hidden="true"
          className="absolute -right-6 -bottom-10 h-48 w-48 rotate-12 bg-amber/70 blur-2xl"
          style={{ clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" }}
        />
        <div className="relative mx-auto flex max-w-6xl items-center gap-5 px-4 py-9 sm:py-12">
          <ElementTile
            symbol={bandTile?.symbol ?? "E7"}
            index={bandTile?.index ?? 7}
            size="lg"
            tone="amber"
            className="hidden sm:inline-flex"
          />
          <div>
            <p className="text-xs font-semibold tracking-widest text-amber uppercase">
              Browse the range
            </p>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
              {bandTitle}
            </h1>
            <p className="mt-1.5 text-[13px] text-paper/70 tabular-nums">
              {total} product{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <h2 className="font-display text-lg font-bold">Filters</h2>
          <Suspense fallback={<div className="mt-6 h-96 skeleton" />}>
            <CatalogFilters brands={facets.brands} strengths={facets.strengths} />
          </Suspense>
        </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist pb-4">
          <p className="text-sm text-slate tabular-nums">
            {total} product{total === 1 ? "" : "s"}
          </p>
          <nav aria-label="Sort products" className="flex flex-wrap gap-2 text-[13px]">
            {(Object.keys(CATALOG_SORTS) as CatalogSort[]).map((key) => (
              <Link
                key={key}
                href={qs(sp, { sort: key === "new" ? null : key })}
                aria-current={filters.sort === key ? "true" : undefined}
                className={cx(
                  "border-2 px-3 py-1 font-medium transition-colors",
                  filters.sort === key
                    ? "border-ink bg-ink text-paper"
                    : "border-mist text-slate hover:border-ink hover:text-ink",
                )}
              >
                {CATALOG_SORTS[key].label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {products.length === 0 ? (
            <EmptyState
              symbol="∅"
              title="Nothing matches those filters"
              body="Try removing a filter or two, or browse the full range instead."
              action={
                <Link href="/products" className={buttonClass("secondary", "sm")}>
                  Clear all filters
                </Link>
              }
            />
          ) : (
            <ProductGrid products={products} locked={locked} />
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between border-t border-mist pt-5 text-sm">
            {filters.page > 1 ? (
              <Link href={qs(sp, { page: String(filters.page - 1) })} className="text-slate hover:text-ink">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-slate tabular-nums">
              Page {filters.page} of {totalPages}
            </span>
            {filters.page < totalPages ? (
              <Link href={qs(sp, { page: String(filters.page + 1) })} className="text-slate hover:text-ink">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
        </section>
      </div>
    </>
  );
}
