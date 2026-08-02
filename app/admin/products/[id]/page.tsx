import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteProductAction } from "@/lib/actions/admin/products";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { ImageManager } from "@/components/admin/image-manager";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ flavour: "asc" }, { strengthMg: "asc" }] },
    },
  });
  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        title={product.name}
        description={`/${product.slug}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href={`/products/${product.slug}`} target="_blank" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              View in store ↗
            </Link>
            <Link href="/admin/products" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              ← Products
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <ImageManager
          productId={product.id}
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
        />

        <ProductEditor
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            category: product.category,
            description: product.description,
            basePriceCents: product.basePriceCents,
            featured: product.featured,
            published: product.published,
            variants: product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              flavour: v.flavour,
              strengthMg: v.strengthMg,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
              weightGrams: v.weightGrams,
              active: v.active,
            })),
          }}
        />

        <section className="border border-alert/40 bg-alert/5 p-5">
          <h2 className="font-display text-sm font-bold text-alert">Danger zone</h2>
          <p className="mt-1 text-xs text-slate">
            Deleting is permanent. Products with order history can&apos;t be deleted, unpublish them
            instead.
          </p>
          <div className="mt-3">
            <DeleteProductButton action={deleteProductAction} productId={product.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
