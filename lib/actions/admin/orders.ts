"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { shippingConfirmationEmail, type OrderEmailData } from "@/lib/email/templates";
import { canTransition, CARRIERS, carrierName, trackingUrlFor } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { zodMessage, type ActionState } from "../types";

const transitionSchema = z.object({
  orderId: z.string().min(1),
  to: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().trim().max(60).optional(),
  carrier: z.string().trim().max(40).optional(),
});

function toEmailData(order: {
  number: string;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipSuburb: string;
  shipState: string;
  shipPostcode: string;
  shippingMethod: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{ name: string; variantLabel: string; quantity: number; unitPriceCents: number }>;
}): OrderEmailData {
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
    items: order.items,
  };
}

export async function transitionOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = transitionSchema.safeParse({
    orderId: formData.get("orderId"),
    to: formData.get("to"),
    trackingNumber: formData.get("trackingNumber") ?? undefined,
    carrier: formData.get("carrier") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const { orderId, to, trackingNumber, carrier } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, message: "Order not found." };
  if (!canTransition(order.status, to)) {
    return { ok: false, message: `Can't move an order from ${order.status} to ${to}.` };
  }

  if (to === "PROCESSING") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING", processingAt: new Date() },
    });
  } else if (to === "SHIPPED") {
    if (!trackingNumber || !carrier) {
      return { ok: false, message: "A tracking number and carrier are required to mark shipped." };
    }
    if (!CARRIERS[carrier]) {
      return { ok: false, message: "Choose a valid carrier." };
    }
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED", shippedAt: new Date(), trackingNumber, carrier },
      include: { items: true },
    });
    const { subject, html } = shippingConfirmationEmail(
      toEmailData(updated),
      carrierName(carrier) ?? carrier,
      trackingNumber,
      trackingUrlFor(carrier, trackingNumber),
    );
    await sendEmail({ to: updated.email, subject, html });
  } else if (to === "DELIVERED") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  } else if (to === "CANCELLED") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      }),
      prisma.stockReservation.deleteMany({ where: { orderId } }),
    ]);
  } else if (to === "REFUNDED") {
    if (!order.stripePaymentIntentId) {
      return { ok: false, message: "This order has no payment to refund." };
    }
    try {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? `Stripe refund failed: ${error.message}` : "Refund failed.",
      };
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
  } else {
    return { ok: false, message: "That transition isn't available here." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
  return { ok: true, message: `Order moved to ${to}.` };
}
