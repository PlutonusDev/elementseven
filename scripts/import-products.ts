import { readFileSync } from "fs";
import path from "path";
import { Category, PrismaClient, StockReason } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const importSchema = z.object({
  exportedAt: z.string(),
  products: z.array(
    z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      brand: z.string().min(1),
      category: z.nativeEnum(Category),
      description: z.string(),
      basePriceCents: z.number().int().min(0),
      featured: z.boolean(),
      published: z.boolean(),
      images: z.array(
        z.object({ url: z.string().min(1), alt: z.string(), position: z.number().int() }),
      ),
      variants: z
        .array(
          z.object({
            sku: z.string().min(1),
            flavour: z.string().nullable(),
            strengthMg: z.number().int().nullable(),
            priceCents: z.number().int().nullable(),
            stockQty: z.number().int().min(0),
            weightGrams: z.number().int().min(1),
            active: z.boolean(),
          }),
        )
        .min(1),
    }),
  ),
});

async function main() {
  const inFile = process.argv[2] ?? "product-export.json";
  const raw = JSON.parse(readFileSync(path.resolve(inFile), "utf8"));
  const parsed = importSchema.parse(raw);

  let created = 0;
  let updated = 0;

  for (const p of parsed.products) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      include: { variants: true },
    });

    const productData = {
      name: p.name,
      brand: p.brand,
      category: p.category,
      description: p.description,
      basePriceCents: p.basePriceCents,
      featured: p.featured,
      published: p.published,
    };

    await prisma.$transaction(async (tx) => {
      let productId: string;

      if (existing) {
        await tx.product.update({ where: { id: existing.id }, data: productData });
        await tx.productImage.deleteMany({ where: { productId: existing.id } });
        productId = existing.id;
        updated++;
      } else {
        const row = await tx.product.create({ data: { slug: p.slug, ...productData } });
        productId = row.id;
        created++;
      }

      await tx.productImage.createMany({
        data: p.images.map((i) => ({ productId, url: i.url, alt: i.alt, position: i.position })),
      });

      for (const v of p.variants) {
        const existingVariant = existing?.variants.find((ev) => ev.sku === v.sku);
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              flavour: v.flavour,
              strengthMg: v.strengthMg,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
              weightGrams: v.weightGrams,
              active: v.active,
            },
          });
          if (existingVariant.stockQty !== v.stockQty) {
            await tx.stockMovement.create({
              data: {
                variantId: existingVariant.id,
                delta: v.stockQty - existingVariant.stockQty,
                reason: StockReason.CORRECTION,
                note: `Product import (${path.basename(inFile)})`,
              },
            });
          }
        } else {
          const createdVariant = await tx.productVariant.create({
            data: {
              productId,
              sku: v.sku,
              flavour: v.flavour,
              strengthMg: v.strengthMg,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
              weightGrams: v.weightGrams,
              active: v.active,
            },
          });
          if (v.stockQty > 0) {
            await tx.stockMovement.create({
              data: {
                variantId: createdVariant.id,
                delta: v.stockQty,
                reason: StockReason.RECEIVED,
                note: `Product import (${path.basename(inFile)})`,
              },
            });
          }
        }
      }
    });
  }

  console.log(`Import complete: ${created} created, ${updated} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
