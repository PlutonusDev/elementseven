import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess, isApproved } from "@/lib/access";
import { CATEGORIES } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { CARD_INCLUDE, toCardData } from "@/lib/products";
import { availableQuantities } from "@/lib/stock";
import { Gallery } from "@/components/store/gallery";
import { ProductGrid } from "@/components/store/product-card";
import { VariantPicker } from "@/components/store/variant-picker";
import { buttonClass, ElementTile } from "@/components/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, published: true },
  });
  if (!product?.published) return { title: "Product" };
  return { title: product.name, description: product.description.slice(0, 155) };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { where: { active: true }, orderBy: [{ flavour: "asc" }, { strengthMg: "asc" }] },
    },
  });
  if (!product || !product.published || product.variants.length === 0) notFound();

  const [availability, relatedRaw, access] = await Promise.all([
    availableQuantities(product.variants.map((v) => v.id)),
    prisma.product.findMany({
      where: { published: true, category: product.category, id: { not: product.id } },
      include: CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    getAccess(),
  ]);
  const locked = !isApproved(access);

  const category = CATEGORIES[product.category];
  const pickerVariants = product.variants.map((v) => ({
    id: v.id,
    flavour: v.flavour,
    strengthMg: v.strengthMg,
    priceCents: v.priceCents,
    available: availability.get(v.id) ?? 0,
  }));

  return (
    <div className="py-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-slate">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/products" className="hover:text-ink">Shop</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/products?category=${product.category}`} className="hover:text-ink">
              {category.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-24">
          {locked ? (
            <div className="lock-stripes grid aspect-square place-items-center border-2 border-ink">
              <div className="flex max-w-[240px] flex-col items-center gap-3 border-2 border-ink bg-paper px-6 py-5 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
                <span aria-hidden="true" className="text-3xl">
                  🔒
                </span>
                <p className="text-[11px] font-bold tracking-widest uppercase">
                  Imagery locked
                </p>
                <p className="text-xs leading-relaxed text-slate">
                  Product photos are only shown to approved customers.
                </p>
              </div>
            </div>
          ) : (
            <Gallery
              name={product.name}
              images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
            />
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-nitro uppercase">{product.brand}</p>
              <h1 className="mt-1.5 font-display text-3xl leading-tight font-black tracking-tight sm:text-4xl">
                {product.name}
              </h1>
            </div>
            <ElementTile symbol={category.symbol} index={category.index} size="md" tone="nitro" />
          </div>

          <div className="mt-6">
            {locked ? (
              <div className="animate-rise border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_var(--color-amber)]">
                <p className="font-display text-lg font-bold">
                  {access.kind === "PENDING"
                    ? "Your application is under review"
                    : "Approval required to view pricing & buy"}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">
                  {access.kind === "PENDING"
                    ? "We'll email you as soon as it's decided, usually within one business day."
                    : "A quick one-minute application unlocks the full range, imagery and pricing."}
                </p>
                {access.kind !== "PENDING" && (
                  <Link href="/request-access" className={buttonClass("amber") + " mt-4"}>
                    {access.kind === "GUEST" ? "Create account & apply →" : "Request access →"}
                  </Link>
                )}
              </div>
            ) : (
              <VariantPicker
                basePriceCents={product.basePriceCents}
                axisLabel={category.axisLabel}
                variants={pickerVariants}
              />
            )}
          </div>

          <div className="mt-8 border-t-2 border-ink pt-6">
            <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-slate uppercase">
              <span aria-hidden="true" className="inline-block h-3 w-1.5 bg-amber" />
              Description
            </h2>
            <div className="mt-3">
              {product.description
                .split(/\n{2,}/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, i) => (
                  <p
                    key={i}
                    className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink/85 first:mt-0"
                  >
                    {para}
                  </p>
                ))}
            </div>
          </div>

          <p className="mt-6 border border-mist bg-white px-3 py-2 text-[11px] leading-relaxed text-slate">
            WARNING: This product contains nicotine. Nicotine is an addictive chemical. 18+ only.
          </p>
        </div>
      </div>

      {relatedRaw.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl font-black tracking-tight">
            More <span className="text-nitro">{category.label.toLowerCase()}</span>
          </h2>
          <div className="mt-6">
            <ProductGrid products={relatedRaw.map(toCardData)} locked={locked} />
          </div>
        </section>
      )}
    </div>
  );
}
