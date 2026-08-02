import { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";

const LOW_STOCK_CARD_THRESHOLD = LOW_STOCK_THRESHOLD * 2;

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  imageUrl: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  inStock: boolean;
  featured: boolean;
  lowStockUnits: number | null;
};

type ProductForCard = Prisma.ProductGetPayload<{
  include: { images: true; variants: true };
}>;

export const CARD_INCLUDE = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { where: { active: true } },
};

export function toCardData(product: ProductForCard): ProductCardData {
  const prices = product.variants.length
    ? product.variants.map((v) => v.priceCents ?? product.basePriceCents)
    : [product.basePriceCents];
  const stockedVariants = product.variants.filter((v) => v.stockQty > 0);
  const totalStock = stockedVariants.reduce((sum, v) => sum + v.stockQty, 0);
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    imageUrl: product.images[0]?.url ?? null,
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
    featured: product.featured,
    lowStockUnits: stockedVariants.length > 0 && totalStock <= LOW_STOCK_CARD_THRESHOLD ? totalStock : null,
    inStock: product.variants.some((v) => v.stockQty > 0),
  };
}

export const CATALOG_SORTS = {
  new: { label: "Newest", orderBy: { createdAt: "desc" as const } },
  "price-asc": { label: "Price: low to high", orderBy: { basePriceCents: "asc" as const } },
  "price-desc": { label: "Price: high to low", orderBy: { basePriceCents: "desc" as const } },
  name: { label: "Name A–Z", orderBy: { name: "asc" as const } },
} as const;

export type CatalogSort = keyof typeof CATALOG_SORTS;

export type CatalogFilters = {
  categories: Category[];
  brands: string[];
  strengths: number[];
  minPriceCents: number | null;
  maxPriceCents: number | null;
  inStockOnly: boolean;
  sort: CatalogSort;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseCatalogParams(sp: SearchParams): CatalogFilters {
  const categories = toArray(sp.category).filter((c): c is Category =>
    Object.keys(Category).includes(c),
  );
  const strengths = toArray(sp.strength)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
  const minPrice = Number.parseFloat(String(sp.min ?? ""));
  const maxPrice = Number.parseFloat(String(sp.max ?? ""));
  const sort = String(sp.sort ?? "new");
  const page = Number.parseInt(String(sp.page ?? "1"), 10);

  return {
    categories,
    brands: toArray(sp.brand).filter(Boolean),
    strengths,
    minPriceCents: Number.isFinite(minPrice) ? Math.round(minPrice * 100) : null,
    maxPriceCents: Number.isFinite(maxPrice) ? Math.round(maxPrice * 100) : null,
    inStockOnly: sp.stock === "in",
    sort: sort in CATALOG_SORTS ? (sort as CatalogSort) : "new",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export const CATALOG_PAGE_SIZE = 12;

export async function queryCatalog(filters: CatalogFilters) {
  const where: Prisma.ProductWhereInput = { published: true };
  if (filters.categories.length) where.category = { in: filters.categories };
  if (filters.brands.length) where.brand = { in: filters.brands };
  if (filters.minPriceCents !== null || filters.maxPriceCents !== null) {
    where.basePriceCents = {
      ...(filters.minPriceCents !== null ? { gte: filters.minPriceCents } : {}),
      ...(filters.maxPriceCents !== null ? { lte: filters.maxPriceCents } : {}),
    };
  }
  if (filters.strengths.length) {
    where.variants = { some: { active: true, strengthMg: { in: filters.strengths } } };
  }
  if (filters.inStockOnly) {
    const stockClause = { active: true, stockQty: { gt: 0 } };
    where.variants = filters.strengths.length
      ? { some: { ...stockClause, strengthMg: { in: filters.strengths } } }
      : { some: stockClause };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: CARD_INCLUDE,
      orderBy: CATALOG_SORTS[filters.sort].orderBy,
      skip: (filters.page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map(toCardData), total, pageSize: CATALOG_PAGE_SIZE };
}

export async function catalogFacets() {
  const [brands, strengths] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { active: true, strengthMg: { not: null }, product: { published: true } },
      select: { strengthMg: true },
      distinct: ["strengthMg"],
      orderBy: { strengthMg: "asc" },
    }),
  ]);
  return {
    brands: brands.map((b) => b.brand),
    strengths: strengths.map((s) => s.strengthMg!).filter((n) => n !== null),
  };
}
