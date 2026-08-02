"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Category } from "@prisma/client";
import { saveProductAction } from "@/lib/actions/admin/products";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/catalog";
import { Alert, Button, cx, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type VariantRow = {
  key: string;
  id: string | null;
  flavour: string;
  strengthMg: string;
  sku: string;
  price: string;
  stockQty: string;
  weightGrams: string;
  active: boolean;
};

export type EditorProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: Category;
  description: string;
  basePriceCents: number;
  featured: boolean;
  published: boolean;
  variants: Array<{
    id: string;
    sku: string;
    flavour: string | null;
    strengthMg: number | null;
    priceCents: number | null;
    stockQty: number;
    weightGrams: number;
    active: boolean;
  }>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function centsToInput(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function rowKey(flavour: string, strength: string): string {
  return `${flavour.trim().toLowerCase()}__${strength.trim()}`;
}

function skuSuggest(brand: string, slug: string, flavour: string, strength: string, i: number): string {
  const base = (brand || slug || "SKU").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toUpperCase();
  const f = flavour
    ? flavour.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).map((w) => w.slice(0, 3)).join("").slice(0, 6).toUpperCase()
    : "STD";
  const s = strength !== "" ? strength : String(i + 1).padStart(2, "0");
  return `${base}-${f}-${s}`;
}

export function ProductEditor({ product }: { product: EditorProduct | null }) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState<Category>(product?.category ?? "DISPOSABLES");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(centsToInput(product?.basePriceCents ?? null));
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [published, setPublished] = useState(product?.published ?? true);

  const initialFlavours = product
    ? [...new Set(product.variants.map((v) => v.flavour).filter((f): f is string => !!f))]
    : [];
  const initialStrengths = product
    ? [...new Set(product.variants.map((v) => v.strengthMg).filter((s): s is number => s !== null))]
    : [];

  const [flavourAxis, setFlavourAxis] = useState(initialFlavours.join(", "));
  const [strengthAxis, setStrengthAxis] = useState(initialStrengths.join(", "));

  const [rows, setRows] = useState<VariantRow[]>(
    product
      ? product.variants.map((v) => ({
          key: rowKey(v.flavour ?? "", v.strengthMg === null ? "" : String(v.strengthMg)),
          id: v.id,
          flavour: v.flavour ?? "",
          strengthMg: v.strengthMg === null ? "" : String(v.strengthMg),
          sku: v.sku,
          price: centsToInput(v.priceCents),
          stockQty: String(v.stockQty),
          weightGrams: String(v.weightGrams),
          active: v.active,
        }))
      : [],
  );

  const [state, formAction] = useActionState(saveProductAction, null);

  const axisLabel = CATEGORIES[category].axisLabel;

  function parseFlavours(): string[] {
    return flavourAxis.split(",").map((s) => s.trim()).filter(Boolean);
  }
  function parseStrengths(): string[] {
    return strengthAxis.split(",").map((s) => s.trim()).filter((s) => s !== "" && !Number.isNaN(Number(s)));
  }

  function generate() {
    const flavours = parseFlavours();
    const strengths = parseStrengths();
    const combos: Array<{ flavour: string; strength: string }> = [];
    const fList = flavours.length ? flavours : [""];
    const sList = strengths.length ? strengths : [""];
    for (const f of fList) {
      for (const s of sList) {
        combos.push({ flavour: f, strength: s });
      }
    }
    const existing = new Map(rows.map((r) => [rowKey(r.flavour, r.strengthMg), r]));
    const next: VariantRow[] = combos.map((combo, i) => {
      const key = rowKey(combo.flavour, combo.strength);
      const prev = existing.get(key);
      if (prev) return { ...prev, key };
      return {
        key,
        id: null,
        flavour: combo.flavour,
        strengthMg: combo.strength,
        sku: skuSuggest(brand, slug, combo.flavour, combo.strength, i),
        price: "",
        stockQty: "0",
        weightGrams: "50",
        active: true,
      };
    });
    setRows(next);
  }

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const payload = useMemo(() => {
    const basePriceCents = basePrice ? Math.round(Number.parseFloat(basePrice) * 100) : 0;
    return {
      id: product?.id ?? null,
      name: name.trim(),
      slug: slug.trim(),
      brand: brand.trim(),
      category,
      description: description.trim(),
      basePriceCents: Number.isFinite(basePriceCents) ? basePriceCents : 0,
      featured,
      published,
      variants: rows.map((r, i) => ({
        id: r.id,
        sku: r.sku.trim() || skuSuggest(brand, slug, r.flavour, r.strengthMg, i),
        flavour: r.flavour.trim() || null,
        strengthMg: r.strengthMg.trim() === "" ? null : Number.parseInt(r.strengthMg, 10),
        priceCents: r.price.trim() === "" ? null : Math.round(Number.parseFloat(r.price) * 100),
        stockQty: Number.parseInt(r.stockQty, 10) || 0,
        weightGrams: Number.parseInt(r.weightGrams, 10) || 0,
        active: r.active,
      })),
    };
  }, [product?.id, name, slug, brand, category, description, basePrice, featured, published, rows]);

  const cellClass = "w-full border border-mist bg-white px-2 py-1 text-[13px] focus:border-ink";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 border border-mist bg-white p-5">
          <h2 className="font-display text-sm font-bold">Details</h2>
          <div>
            <Label htmlFor="pe-name">Name</Label>
            <Input
              id="pe-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!product && (slug === "" || slug === slugify(name))) setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <Label htmlFor="pe-slug">Slug</Label>
            <div className="flex gap-2">
              <Input id="pe-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
              <Button type="button" variant="secondary" size="sm" onClick={() => setSlug(slugify(name))}>
                From name
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pe-brand">Brand</Label>
              <Input id="pe-brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pe-category">Category</Label>
              <Select
                id="pe-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIES[c].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="pe-desc">Description</Label>
            <Textarea
              id="pe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>
        </section>

        <section className="space-y-4 border border-mist bg-white p-5">
          <h2 className="font-display text-sm font-bold">Pricing &amp; visibility</h2>
          <div>
            <Label htmlFor="pe-price">Base price (A$)</Label>
            <Input
              id="pe-price"
              inputMode="decimal"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="mt-1 text-xs text-slate">Used when a variant has no price override.</p>
          </div>
          <label className="flex items-center gap-2.5 text-[13px]">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 accent-ink" />
            Published (visible in store)
          </label>
          <label className="flex items-center gap-2.5 text-[13px]">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4 accent-ink" />
            Featured on home page
          </label>
        </section>
      </div>

      <section className="border border-mist bg-white p-5">
        <h2 className="font-display text-sm font-bold">Variant matrix</h2>
        <p className="mt-1 text-xs text-slate">
          Enter axis values, generate the grid, then set SKU, price, stock and weight per row.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pe-flavours">{axisLabel} axis (comma-separated)</Label>
            <Input
              id="pe-flavours"
              value={flavourAxis}
              onChange={(e) => setFlavourAxis(e.target.value)}
              placeholder="e.g. Cool Mint, Mango, Berry"
            />
          </div>
          <div>
            <Label htmlFor="pe-strengths">Nicotine strength axis (mg, comma-separated)</Label>
            <Input
              id="pe-strengths"
              value={strengthAxis}
              onChange={(e) => setStrengthAxis(e.target.value)}
              placeholder="e.g. 0, 3, 6"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={generate}>
            Generate variant rows
          </Button>
          <span className="text-xs text-slate">
            Leave an axis blank if it doesn&apos;t apply. Existing rows are preserved by value.
          </span>
        </div>

        {rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="text-[11px] tracking-wider text-slate uppercase">
                  <th className="border-b border-mist px-2 py-1.5 text-left">{axisLabel}</th>
                  <th className="border-b border-mist px-2 py-1.5 text-left">mg</th>
                  <th className="border-b border-mist px-2 py-1.5 text-left">SKU</th>
                  <th className="border-b border-mist px-2 py-1.5 text-right">Price A$</th>
                  <th className="border-b border-mist px-2 py-1.5 text-right">Stock</th>
                  <th className="border-b border-mist px-2 py-1.5 text-right">Weight g</th>
                  <th className="border-b border-mist px-2 py-1.5 text-center">Active</th>
                  <th className="border-b border-mist px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className={cx(!r.active && "opacity-50")}>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cellClass} value={r.flavour} onChange={(e) => updateRow(r.key, { flavour: e.target.value })} placeholder="—" />
                    </td>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cx(cellClass, "w-16")} value={r.strengthMg} onChange={(e) => updateRow(r.key, { strengthMg: e.target.value })} placeholder="—" />
                    </td>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cellClass} value={r.sku} onChange={(e) => updateRow(r.key, { sku: e.target.value })} />
                    </td>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cx(cellClass, "w-20 text-right")} inputMode="decimal" value={r.price} onChange={(e) => updateRow(r.key, { price: e.target.value })} placeholder="base" />
                    </td>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cx(cellClass, "w-16 text-right")} inputMode="numeric" value={r.stockQty} onChange={(e) => updateRow(r.key, { stockQty: e.target.value })} />
                    </td>
                    <td className="border-b border-mist px-2 py-1">
                      <input className={cx(cellClass, "w-16 text-right")} inputMode="numeric" value={r.weightGrams} onChange={(e) => updateRow(r.key, { weightGrams: e.target.value })} />
                    </td>
                    <td className="border-b border-mist px-2 py-1 text-center">
                      <input type="checkbox" checked={r.active} onChange={(e) => updateRow(r.key, { active: e.target.checked })} className="size-4 accent-ink" />
                    </td>
                    <td className="border-b border-mist px-2 py-1 text-right">
                      <button type="button" onClick={() => removeRow(r.key)} className="text-[13px] text-slate underline underline-offset-2 hover:text-alert">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length === 0 && (
          <p className="mt-4 border border-dashed border-mist px-3 py-6 text-center text-xs text-slate">
            No variants yet, enter axis values above and generate rows. A product needs at least one
            variant.
          </p>
        )}
      </section>

      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…" disabled={rows.length === 0}>
          {product ? "Save changes" : "Create product"}
        </SubmitButton>
        <a href="/admin/products" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
          Cancel
        </a>
      </div>
    </form>
  );
}
