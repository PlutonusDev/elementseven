import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/orders";
import { Badge, type BadgeTone } from "@/components/ui";

const TONES: Record<OrderStatus, BadgeTone> = {
  PENDING: "neutral",
  PAID: "accent",
  PROCESSING: "accent",
  SHIPPED: "ink",
  DELIVERED: "outline",
  CANCELLED: "alert",
  REFUNDED: "alert",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
