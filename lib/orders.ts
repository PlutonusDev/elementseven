import type { OrderStatus } from "@prisma/client";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const CARRIERS: Record<string, { name: string; trackingUrl: (t: string) => string }> = {
  auspost: {
    name: "Australia Post",
    trackingUrl: (t) => `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(t)}`,
  },
  startrack: {
    name: "StarTrack",
    trackingUrl: (t) => `https://startrack.com.au/track/details/${encodeURIComponent(t)}`,
  },
  couriersplease: {
    name: "CouriersPlease",
    trackingUrl: (t) => `https://www.couriersplease.com.au/tools-track/no/${encodeURIComponent(t)}`,
  },
  aramex: {
    name: "Aramex",
    trackingUrl: (t) => `https://www.aramex.com.au/tools/track/?l=${encodeURIComponent(t)}`,
  },
};

export function trackingUrlFor(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const c = CARRIERS[carrier];
  return c ? c.trackingUrl(trackingNumber) : null;
}

export function carrierName(carrier: string | null): string | null {
  if (!carrier) return null;
  return CARRIERS[carrier]?.name ?? carrier;
}

export function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `E7-${time}${rand}`;
}

export const RESERVATION_MINUTES = 20;
