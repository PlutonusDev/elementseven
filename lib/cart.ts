import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { variantLabel } from "@/lib/catalog";
import { reservedQuantities } from "@/lib/stock";

const CART_COOKIE = "e7_cart";

export type CartLine = {
  itemId: string;
  variantId: string;
  quantity: number;
  name: string;
  slug: string;
  variantLabel: string;
  sku: string;
  unitPriceCents: number;
  weightGrams: number;
  available: number;
  imageUrl: string | null;
};

export type CartSummary = {
  lines: CartLine[];
  subtotalCents: number;
  totalWeightGrams: number;
  itemCount: number;
};

const CART_INCLUDE = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { position: "asc" as const }, take: 1 } },
          },
        },
      },
    },
  },
};

export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await prisma.cart.findUnique({
    where: { token },
    include: { items: true },
  });
  if (!guest || guest.userId || guest.items.length === 0) return;
  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    for (const item of guest.items) {
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity: { increment: item.quantity } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
      });
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

async function getCartRecord() {
  const session = await auth();
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value ?? null;

  if (session?.user?.id) {
    if (token) {
      const guest = await prisma.cart.findUnique({
        where: { token },
        select: { userId: true, items: { select: { id: true }, take: 1 } },
      });
      if (guest && !guest.userId && guest.items.length > 0) {
        await mergeGuestCartIntoUser(session.user.id);
      }
    }
    return prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: CART_INCLUDE,
    });
  }

  if (!token) return null;
  const cart = await prisma.cart.findUnique({ where: { token }, include: CART_INCLUDE });
  return cart && !cart.userId ? cart : null;
}

export async function getCart(): Promise<CartSummary> {
  const cart = await getCartRecord();
  if (!cart || cart.items.length === 0) {
    return { lines: [], subtotalCents: 0, totalWeightGrams: 0, itemCount: 0 };
  }

  const reserved = await reservedQuantities(cart.items.map((i) => i.variantId));

  const lines: CartLine[] = cart.items
    .filter((item) => item.variant.active && item.variant.product.published)
    .map((item) => {
      const v = item.variant;
      return {
        itemId: item.id,
        variantId: v.id,
        quantity: item.quantity,
        name: v.product.name,
        slug: v.product.slug,
        variantLabel: variantLabel(v.flavour, v.strengthMg),
        sku: v.sku,
        unitPriceCents: v.priceCents ?? v.product.basePriceCents,
        weightGrams: v.weightGrams,
        available: Math.max(0, v.stockQty - (reserved.get(v.id) ?? 0)),
        imageUrl: v.product.images[0]?.url ?? null,
      };
    });

  return {
    lines,
    subtotalCents: lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
    totalWeightGrams: lines.reduce((sum, l) => sum + l.weightGrams * l.quantity, 0),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

export async function ensureCartId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    await mergeGuestCartIntoUser(session.user.id);
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });
    return cart.id;
  }

  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing && !existing.userId) return existing.id;
  }
  token = crypto.randomUUID();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  const cart = await prisma.cart.create({ data: { token } });
  return cart.id;
}

export async function clearCart(): Promise<void> {
  const cart = await getCartRecord();
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
