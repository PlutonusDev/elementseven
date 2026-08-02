import crypto from "crypto";
import { appUrl, authSecret } from "@/lib/env";

export function unsubscribeToken(userId: string): string {
  return crypto
    .createHmac("sha256", authSecret())
    .update(`unsubscribe:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = unsubscribeToken(userId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function unsubscribeUrl(userId: string): string {
  return `${appUrl()}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}
