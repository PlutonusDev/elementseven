"use server";

import { getAccess, isApproved } from "@/lib/access";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { generateOrderNumber, RESERVATION_MINUTES } from "@/lib/orders";
import { quoteShipping } from "@/lib/shipping";
import { releaseExpiredReservations } from "@/lib/stock";
import { getStripe } from "@/lib/stripe";
import { addressSchema, emailSchema } from "@/lib/validation";
import { zodMessage } from "./types";
import { z } from "zod";

const checkoutSchema = addressSchema.extend({
  email: emailSchema,
  shippingOptionId: z.string().min(1, "Choose a shipping option"),
});

export type CheckoutSessionState =
  | { ok: false; message: string }
  | { ok: true; clientSecret: string }
  | null;

export async function createCheckoutSessionAction(
  _prev: CheckoutSessionState,
  formData: FormData,
): Promise<CheckoutSessionState> {
  const access = await getAccess();
  if (!isApproved(access)) {
    return { ok: false, message: "Your account needs approved access before you can check out." };
  }
  const session = await auth();
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? undefined,
    suburb: formData.get("suburb"),
    state: formData.get("state"),
    postcode: formData.get("postcode"),
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email"),
    shippingOptionId: formData.get("shippingOptionId"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const input = parsed.data;

  const cart = await getCart();
  if (cart.lines.length === 0) return { ok: false, message: "Your cart is empty." };

  for (const line of cart.lines) {
    if (line.available < line.quantity) {
      return {
        ok: false,
        message: `Not enough stock for ${line.name} (${line.variantLabel}), only ${line.available} available. Please adjust your cart.`,
      };
    }
  }

  await releaseExpiredReservations();

  const options = await quoteShipping({
    postcode: input.postcode,
    weightGrams: cart.totalWeightGrams,
    subtotalCents: cart.subtotalCents,
  });
  const shippingOption = options.find((o) => o.id === input.shippingOptionId);
  if (!shippingOption) {
    return { ok: false, message: "That shipping option is no longer valid, please re-estimate." };
  }

  const totalCents = cart.subtotalCents + shippingOption.priceCents;
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);

  let orderId: string;
  let orderNumber: string;
  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const line of cart.lines) {
        const variant = await tx.productVariant.findUnique({
          where: { id: line.variantId },
          select: { stockQty: true },
        });
        const reserved = await tx.stockReservation.aggregate({
          where: { variantId: line.variantId, expiresAt: { gt: new Date() } },
          _sum: { quantity: true },
        });
        const available = (variant?.stockQty ?? 0) - (reserved._sum.quantity ?? 0);
        if (available < line.quantity) {
          throw new Error(
            `Not enough stock for ${line.name} (${line.variantLabel}). Please adjust your cart.`,
          );
        }
      }

      return tx.order.create({
        data: {
          number: generateOrderNumber(),
          userId: session?.user?.id ?? null,
          email: input.email,
          subtotalCents: cart.subtotalCents,
          shippingCents: shippingOption.priceCents,
          totalCents,
          shippingMethod: shippingOption.name,
          shipName: input.fullName,
          shipLine1: input.line1,
          shipLine2: input.line2,
          shipSuburb: input.suburb,
          shipState: input.state,
          shipPostcode: input.postcode,
          shipPhone: input.phone,
          items: {
            create: cart.lines.map((line) => ({
              variantId: line.variantId,
              productSlug: line.slug,
              name: line.name,
              variantLabel: line.variantLabel,
              sku: line.sku,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
            })),
          },
          reservations: {
            create: cart.lines.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
              expiresAt,
            })),
          },
        },
      });
    });
    orderId = order.id;
    orderNumber = order.number;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }

  try {
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      customer_email: input.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aud",
            unit_amount: totalCents,
            product_data: {
              name: `Order ${orderNumber}`,
            },
          },
        },
      ],
      metadata: { orderId },
      payment_intent_data: {
        metadata: { orderId },
        description: `Order ${orderNumber}`,
      },
      return_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!stripeSession.client_secret) throw new Error("Stripe did not return a client secret");

    await prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: stripeSession.id },
    });

    return { ok: true, clientSecret: stripeSession.client_secret };
  } catch (error) {
    await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Payment could not be started: ${error.message}`
          : "Payment could not be started.",
    };
  }
}
