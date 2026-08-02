import Link from "next/link";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { duplicateProductAction, togglePublishAction } from "@/lib/actions/admin/products";
import { AdminCard, AdminPageHeader, Td, Th } from "@/components/admin/ui";
import { Badge, buttonClass, EmptyState } from "@/components/ui";

export const metadata = { title: "Products" };

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const category = CATEGORY_ORDER.find((c) => c === sp.category);
  const q = sp.q?.trim();

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    include: {
      variants: { where: { active: true }, select: { stockQty: true, priceCents: true } },
      _count: { select: { variants: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className={buttonClass("primary", "sm")}>
            + New product
          </Link>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or brand"
          className="border border-mist bg-white px-3 py-1.5 text-[13px] focus:border-ink"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="border border-mist bg-white px-2 py-1.5 text-[13px] focus:border-ink"
        >
          <option value="">All categories</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORIES[c].label}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass("secondary", "sm")}>
          Filter
        </button>
        {(q || category) && (
          <Link href="/admin/products" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <AdminCard>
        {products.length === 0 ? (
          <EmptyState
            symbol="Pr"
            title="No products found"
            body="Try a different filter, or create your first product."
            action={
              <Link href="/admin/products/new" className={buttonClass("primary", "sm")}>
                New product
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Base price</Th>
                  <Th className="text-right">Variants</Th>
                  <Th className="text-right">Stock</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants.reduce((s, v) => s + v.stockQty, 0);
                  return (
                    <tr key={product.id} className="hover:bg-paper">
                      <Td>
                        <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                          {product.name}
                        </Link>
                        <span className="block text-xs text-slate">{product.brand}</span>
                      </Td>
                      <Td className="text-slate">{CATEGORIES[product.category].label}</Td>
                      <Td className="text-right tabular-nums">{formatCents(product.basePriceCents)}</Td>
                      <Td className="text-right tabular-nums">{product._count.variants}</Td>
                      <Td className="text-right tabular-nums">
                        <span className={totalStock === 0 ? "text-alert" : ""}>{totalStock}</span>
                      </Td>
                      <Td>
                        {product.published ? (
                          <Badge tone="accent">Live</Badge>
                        ) : (
                          <Badge tone="neutral">Draft</Badge>
                        )}
                        {product.featured && (
                          <Badge tone="amber" className="ml-1">
                            Featured
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-[13px] text-nitro underline underline-offset-2"
                          >
                            Edit
                          </Link>
                          <form action={togglePublishAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <button type="submit" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
                              {product.published ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                          <form action={duplicateProductAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <button type="submit" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
                              Duplicate
                            </button>
                          </form>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
