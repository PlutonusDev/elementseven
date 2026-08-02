import type Stripe from "stripe";
import { StockReason } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import {
  orderCancelledEmail,
  orderConfirmationEmail,
  type OrderEmailData,
} from "@/lib/email/templates";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

class ShortageError extends Error {}

type OrderWithItems = NonNullable<
  Awaited<ReturnType<typeof loadOrder>>
>;

function loadOrder(where: { id: string } | { stripeSessionId: string }) {
  return prisma.order.findUnique({ where: where as never, include: { items: true } });
}

function toEmailData(order: OrderWithItems): OrderEmailData {
  return {
    number: order.number,
    shipName: order.shipName,
    shipLine1: order.shipLine1,
    shipLine2: order.shipLine2,
    shipSuburb: order.shipSuburb,
    shipState: order.shipState,
    shipPostcode: order.shipPostcode,
    shippingMethod: order.shippingMethod,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      name: i.name,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
  };
}

async function findOrderForSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (orderId) {
    const order = await loadOrder({ id: orderId });
    if (order) return order;
  }
  return loadOrder({ stripeSessionId: session.id });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const order = await findOrderForSession(session);
  if (!order || order.status !== "PENDING") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ShortageError(`Insufficient stock for SKU ${item.sku}`);
        }
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            reason: StockReason.SALE,
            note: `Order ${order.number}`,
            orderId: order.id,
          },
        });
      }
      await tx.stockReservation.deleteMany({ where: { orderId: order.id } });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntentId,
          paymentError: null,
          email: session.customer_details?.email ?? order.email,
        },
      });
    });
  } catch (error) {
    if (error instanceof ShortageError) {
      if (paymentIntentId) {
        await getStripe()
          .refunds.create({ payment_intent: paymentIntentId })
          .catch((e) => console.error(`[webhook] auto-refund failed for ${order.number}:`, e));
      }
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            stripePaymentIntentId: paymentIntentId,
            internalNote: `Auto-refunded: ${error.message}`,
          },
        }),
        prisma.stockReservation.deleteMany({ where: { orderId: order.id } }),
      ]);
      const { subject, html } = orderCancelledEmail(
        toEmailData(order),
        "Part of your order sold out before payment completed, so we couldn't fulfil it.",
      );
      await sendEmail({ to: order.email, subject, html });
      return;
    }
    throw error;
  }

  const { subject, html } = orderConfirmationEmail(
    toEmailData(order),
    `${appUrl()}/account/orders/${order.id}`,
  );
  await sendEmail({ to: order.email, subject, html });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const order = await findOrderForSession(session);
  if (!order || order.status !== "PENDING") return;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), internalNote: "Checkout session expired" },
    }),
    prisma.stockReservation.deleteMany({ where: { orderId: order.id } }),
  ]);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const message = paymentIntent.last_payment_error?.message ?? "Payment failed";
  const orderId = paymentIntent.metadata?.orderId;
  if (orderId) {
    await prisma.order
      .update({ where: { id: orderId }, data: { paymentError: message } })
      .catch(() => {});
    return;
  }
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { paymentError: message },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.refunded) return;
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "REFUNDED" } },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return Response.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;
  }

  return Response.json({ received: true });
}
