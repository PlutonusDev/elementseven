import { writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const outFile = process.argv[2] ?? "product-export.json";

  const products = await prisma.product.findMany({
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { sku: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    productCount: products.length,
    products: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      description: p.description,
      basePriceCents: p.basePriceCents,
      featured: p.featured,
      published: p.published,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })),
      variants: p.variants.map((v) => ({
        sku: v.sku,
        flavour: v.flavour,
        strengthMg: v.strengthMg,
        priceCents: v.priceCents,
        stockQty: v.stockQty,
        weightGrams: v.weightGrams,
        active: v.active,
      })),
    })),
  };

  const target = path.resolve(outFile);
  writeFileSync(target, JSON.stringify(payload, null, 2));

  const variantCount = products.reduce((sum, p) => sum + p.variants.length, 0);
  const uploadImages = products.flatMap((p) => p.images).filter((i) => i.url.startsWith("/uploads/"));
  console.log(`Exported ${products.length} products (${variantCount} variants) to ${target}`);
  if (uploadImages.length > 0) {
    console.log(
      `Note: ${uploadImages.length} image(s) live in public/uploads and must be copied to the server separately.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
