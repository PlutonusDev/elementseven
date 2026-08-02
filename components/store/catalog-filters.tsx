"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/catalog";
import { buttonClass } from "@/components/ui";

const checkbox = "size-4 shrink-0 accent-ink";
const filterLabel = "flex cursor-pointer items-center gap-2.5 text-sm text-slate hover:text-ink";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CatalogFilters({
  brands,
  strengths,
}: {
  brands: string[];
  strengths: number[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cats, setCats] = useState<string[]>([]);
  const [brs, setBrs] = useState<string[]>([]);
  const [strs, setStrs] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [stock, setStock] = useState(false);

  // Keep the controls in sync with the URL, including navbar-driven changes.
  useEffect(() => {
    setCats(searchParams.getAll("category"));
    setBrs(searchParams.getAll("brand"));
    setStrs(searchParams.getAll("strength"));
    setMin(searchParams.get("min") ?? "");
    setMax(searchParams.get("max") ?? "");
    setStock(searchParams.get("stock") === "in");
  }, [searchParams]);

  function apply() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    cats.forEach((c) => params.append("category", c));
    brs.forEach((b) => params.append("brand", b));
    strs.forEach((s) => params.append("strength", s));
    if (min.trim()) params.set("min", min.trim());
    if (max.trim()) params.set("max", max.trim());
    if (stock) params.set("stock", "in");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="mt-6 space-y-7"
    >
      <fieldset>
        <legend className="text-xs font-semibold tracking-widest text-slate uppercase">Category</legend>
        <div className="mt-3 space-y-2">
          {CATEGORY_ORDER.map((category) => (
            <label key={category} className={filterLabel}>
              <input
                type="checkbox"
                checked={cats.includes(category)}
                onChange={() => setCats((c) => toggle(c, category))}
                className={checkbox}
              />
              {CATEGORIES[category].label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold tracking-widest text-slate uppercase">Brand</legend>
        <div className="mt-3 space-y-2">
          {brands.map((brand) => (
            <label key={brand} className={filterLabel}>
              <input
                type="checkbox"
                checked={brs.includes(brand)}
                onChange={() => setBrs((b) => toggle(b, brand))}
                className={checkbox}
              />
              {brand}
            </label>
          ))}
        </div>
      </fieldset>

      {strengths.length > 0 && (
        <fieldset>
          <legend className="text-xs font-semibold tracking-widest text-slate uppercase">
            Nicotine strength
          </legend>
          <div className="mt-3 space-y-2">
            {strengths.map((strength) => (
              <label key={strength} className={filterLabel}>
                <input
                  type="checkbox"
                  checked={strs.includes(String(strength))}
                  onChange={() => setStrs((s) => toggle(s, String(strength)))}
                  className={checkbox}
                />
                {strength}mg
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-xs font-semibold tracking-widest text-slate uppercase">Price (A$)</legend>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-min">Minimum price</label>
          <input
            id="filter-min"
            inputMode="decimal"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full border border-mist bg-white px-3 py-2 text-sm hover:border-slate focus:border-ink"
          />
          <span className="text-slate">–</span>
          <label className="sr-only" htmlFor="filter-max">Maximum price</label>
          <input
            id="filter-max"
            inputMode="decimal"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full border border-mist bg-white px-3 py-2 text-sm hover:border-slate focus:border-ink"
          />
        </div>
      </fieldset>

      <label className={filterLabel}>
        <input
          type="checkbox"
          checked={stock}
          onChange={(e) => setStock(e.target.checked)}
          className={checkbox}
        />
        In stock only
      </label>

      <div className="flex items-center gap-4">
        <button type="submit" className={buttonClass("primary", "sm")}>
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
