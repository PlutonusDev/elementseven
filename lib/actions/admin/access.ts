"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { accessApprovedEmail, accessDeniedEmail } from "@/lib/email/templates";
import { appUrl } from "@/lib/env";
import { zodMessage, type ActionState } from "../types";

const decisionSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVED", "DENIED"]),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters")
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function decideAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = decisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const { requestId, decision, note } = parsed.data;

  const request = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!request) return { ok: false, message: "Application not found." };

  await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      decisionNote: note,
      decidedAt: new Date(),
      decidedById: session.user.id,
    },
  });

  const firstName = request.user.name?.split(/\s+/)[0] || "there";
  const { subject, html } =
    decision === "APPROVED"
      ? accessApprovedEmail(firstName, `${appUrl()}/products`)
      : accessDeniedEmail(firstName, note, `${appUrl()}/request-access`);
  await sendEmail({ to: request.user.email, subject, html });

  revalidatePath("/admin/access");
  revalidatePath(`/admin/access/${requestId}`);
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: decision === "APPROVED" ? "Application approved, customer notified." : "Application denied, customer notified.",
  };
}
