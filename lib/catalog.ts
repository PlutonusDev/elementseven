import type { Category } from "@prisma/client";

export const CATEGORIES: Record<
  Category,
  { label: string; symbol: string; index: number; axisLabel: string }
> = {
  DISPOSABLES: { label: "Disposables", symbol: "Dp", index: 1, axisLabel: "Flavour" },
  POD_SYSTEMS: { label: "Pod Systems", symbol: "Pd", index: 2, axisLabel: "Colour" },
  MODS: { label: "Mods", symbol: "Md", index: 3, axisLabel: "Colour" },
  E_LIQUIDS: { label: "E-Liquids", symbol: "Lq", index: 4, axisLabel: "Flavour" },
  COILS_ACCESSORIES: { label: "Coils & Accessories", symbol: "Ca", index: 5, axisLabel: "Option" },
  BULK: { label: "Bulk Packs", symbol: "Bk", index: 6, axisLabel: "Pack size" },
};

export const CATEGORY_ORDER: Category[] = [
  "DISPOSABLES",
  "POD_SYSTEMS",
  "MODS",
  "E_LIQUIDS",
  "COILS_ACCESSORIES",
  "BULK",
];

export const LOW_STOCK_THRESHOLD = 5;

export function variantLabel(flavour: string | null, strengthMg: number | null): string {
  const parts = [flavour, strengthMg != null ? `${strengthMg}mg` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Standard";
}

export type StockTone = "in" | "low" | "out";

export function stockStatus(available: number): { tone: StockTone; label: string } {
  if (available <= 0) return { tone: "out", label: "Out of stock" };
  if (available <= LOW_STOCK_THRESHOLD) return { tone: "low", label: `Low stock, ${available} left` };
  return { tone: "in", label: "In stock" };
}
