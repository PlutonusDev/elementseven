"use server";

import { Category, Prisma, StockReason } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { zodMessage, type ActionState } from "../types";

const variantInputSchema = z.object({
  id: z.string().nullable(),
  sku: z.string().trim().min(3, "Each variant needs an SKU of 3+ characters").max(48),
  flavour: z.string().trim().min(1).max(60).nullable(),
  strengthMg: z.number().int().min(0).max(200).nullable(),
  priceCents: z.number().int().min(0).max(1_000_000).nullable(),
  stockQty: z.number().int().min(0).max(100_000),
  weightGrams: z.number().int().min(1, "Every variant needs a weight").max(50_000),
  active: z.boolean(),
});

const productInputSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(2, "Enter a product name").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens"),
  brand: z.string().trim().min(1, "Enter a brand").max(60),
  category: z.nativeEnum(Category),
  description: z.string().trim().min(10, "Write a description (10+ characters)"),
  basePriceCents: z.number().int().min(1, "Enter a base price"),
  featured: z.boolean(),
  published: z.boolean(),
  variants: z.array(variantInputSchema).min(1, "Add at least one variant"),
});

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { ok: false, message: "Invalid form payload." };
  }
  const parsed = productInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const input = parsed.data;

  const skus = input.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    return { ok: false, message: "Variant SKUs must be unique within the product." };
  }

  let productId = input.id;
  try {
    await prisma.$transaction(async (tx) => {
      const productData = {
        name: input.name,
        slug: input.slug,
        brand: input.brand,
        category: input.category,
        description: input.description,
        basePriceCents: input.basePriceCents,
        featured: input.featured,
        published: input.published,
      };

      if (productId) {
        const existing = await tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
        if (!existing) throw new Error("Product not found");
        await tx.product.update({ where: { id: productId }, data: productData });

        const incomingIds = new Set(input.variants.filter((v) => v.id).map((v) => v.id));
        for (const stale of existing.variants) {
          if (!incomingIds.has(stale.id) && stale.active) {
            await tx.productVariant.update({ where: { id: stale.id }, data: { active: false } });
          }
        }

        for (const v of input.variants) {
          if (v.id) {
            const before = existing.variants.find((ev) => ev.id === v.id);
            if (!before) throw new Error("Variant mismatch");
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                flavour: v.flavour,
                strengthMg: v.strengthMg,
                priceCents: v.priceCents,
                stockQty: v.stockQty,
                weightGrams: v.weightGrams,
                active: v.active,
              },
            });
            if (before.stockQty !== v.stockQty) {
              await tx.stockMovement.create({
                data: {
                  variantId: v.id,
                  delta: v.stockQty - before.stockQty,
                  reason: StockReason.ADJUSTMENT,
                  note: "Product editor",
                  actorId: session.user.id,
                },
              });
            }
          } else {
            const created = await tx.productVariant.create({
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
                  variantId: created.id,
                  delta: v.stockQty,
                  reason: StockReason.RECEIVED,
                  note: "Initial stock (product editor)",
                  actorId: session.user.id,
                },
              });
            }
          }
        }
      } else {
        const created = await tx.product.create({ data: productData });
        productId = created.id;
        for (const v of input.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: created.id,
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
                variantId: variant.id,
                delta: v.stockQty,
                reason: StockReason.RECEIVED,
                note: "Initial stock (product editor)",
                actorId: session.user.id,
              },
            });
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That slug or SKU is already in use." };
    }
    return { ok: false, message: error instanceof Error ? error.message : "Save failed." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  if (!input.id) redirect(`/admin/products/${productId}`);
  return { ok: true, message: "Product saved." };
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  await prisma.product.update({ where: { id }, data: { published: !product.published } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function duplicateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const source = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, images: true },
  });
  if (!source) return;

  let slug = `${source.slug}-copy`;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${source.slug}-copy-${suffix}`;
  }
  const skuSuffix = suffix === 1 ? "-C" : `-C${suffix}`;

  const copy = await prisma.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      brand: source.brand,
      category: source.category,
      description: source.description,
      basePriceCents: source.basePriceCents,
      featured: false,
      published: false,
      images: {
        create: source.images.map((img) => ({
          url: img.url,
          alt: img.alt,
          position: img.position,
        })),
      },
      variants: {
        create: source.variants.map((v) => ({
          sku: `${v.sku}${skuSuffix}`,
          flavour: v.flavour,
          strengthMg: v.strengthMg,
          priceCents: v.priceCents,
          stockQty: 0,
          weightGrams: v.weightGrams,
          active: v.active,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${copy.id}`);
}

export async function deleteProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const orderItemCount = await prisma.orderItem.count({
    where: { variant: { productId: id } },
  });
  if (orderItemCount > 0) {
    return {
      ok: false,
      message: "This product has order history and can't be deleted, unpublish it instead.",
    };
  }
  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  for (const image of images) {
    await storage.remove(image.url);
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadProductImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image file to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Images must be under 5MB." };
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };

  const extension = file.name.split(".").pop() ?? "";
  let url: string;
  try {
    url = await storage.save({ data: Buffer.from(await file.arrayBuffer()), extension });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Upload failed." };
  }

  const position = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: product.name, position },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Image uploaded." };
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const image = await prisma.productImage.findUnique({
    where: { id },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!image) return;
  await prisma.productImage.delete({ where: { id } });
  await storage.remove(image.url);
  revalidatePath(`/admin/products/${image.product.id}`);
  revalidatePath(`/products/${image.product.slug}`);
}
