"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccess, isApproved } from "@/lib/access";
import { ensureCartId, getCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { quoteShipping, type ShippingOption } from "@/lib/shipping";
import { availableQuantity } from "@/lib/stock";
import { postcodeSchema } from "@/lib/validation";
import { zodMessage, type ActionState } from "./types";

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export async function addToCartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccess();
  if (!isApproved(access)) {
    return { ok: false, message: "Your account needs approved access before you can buy." };
  }
  const parsed = addSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: { select: { published: true } } },
  });
  if (!variant?.active || !variant.product.published) {
    return { ok: false, message: "This product is no longer available." };
  }

  const [available, cartId] = await Promise.all([
    availableQuantity(variant.id),
    ensureCartId(),
  ]);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
  });
  const current = existing?.quantity ?? 0;

  if (available <= current) {
    return {
      ok: false,
      message: available === 0 ? "Out of stock." : "You already have all available stock in your cart.",
    };
  }

  const addQty = Math.min(parsed.data.quantity, available - current);
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
    update: { quantity: { increment: addQty } },
    create: { cartId, variantId: variant.id, quantity: addQty },
  });

  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      addQty < parsed.data.quantity
        ? `Only ${addQty} more in stock, added ${addQty} to your cart.`
        : "Added to cart.",
  };
}

const updateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const cartId = await ensureCartId();
  const item = await prisma.cartItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item || item.cartId !== cartId) {
    return { ok: false, message: "That item is no longer in your cart." };
  }

  if (parsed.data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Removed from cart." };
  }

  const available = await availableQuantity(item.variantId);
  if (available === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    revalidatePath("/", "layout");
    return { ok: false, message: "That item just sold out and was removed from your cart." };
  }

  const finalQty = Math.min(parsed.data.quantity, available);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: finalQty } });
  revalidatePath("/", "layout");

  if (finalQty < parsed.data.quantity) {
    return { ok: false, message: `Only ${available} in stock, quantity set to ${finalQty}.` };
  }
  return { ok: true };
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  const cartId = await ensureCartId();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  revalidatePath("/", "layout");
}

export type ShippingEstimate =
  | { ok: true; options: ShippingOption[] }
  | { ok: false; message: string };

export async function estimateShippingAction(postcode: string): Promise<ShippingEstimate> {
  const parsed = postcodeSchema.safeParse(postcode);
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const cart = await getCart();
  if (cart.lines.length === 0) return { ok: false, message: "Your cart is empty." };

  const options = await quoteShipping({
    postcode: parsed.data,
    weightGrams: cart.totalWeightGrams,
    subtotalCents: cart.subtotalCents,
  });
  if (options.length === 0) {
    return { ok: false, message: "We couldn't find shipping options for that postcode." };
  }
  return { ok: true, options };
}
