import type { ZodError } from "zod";

export type ActionState = { ok: boolean; message?: string } | null;

export function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
