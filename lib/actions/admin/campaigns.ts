"use server";

import { CampaignAudience } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { dispatchCampaign, firstNameOf } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { renderCampaignHtml } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { zodMessage, type ActionState } from "../types";

const campaignSchema = z.object({
  id: z.string().optional(),
  subject: z.string().trim().min(3, "Enter a subject line").max(150),
  htmlBody: z.string().trim().min(10, "Write the email body"),
  audience: z.nativeEnum(CampaignAudience),
  scheduledAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid schedule date"),
});

export async function saveCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = campaignSchema.safeParse({
    id: formData.get("id") || undefined,
    subject: formData.get("subject"),
    htmlBody: formData.get("htmlBody"),
    audience: formData.get("audience"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };
  const { id, scheduledAt, ...data } = parsed.data;

  if (id) {
    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Campaign not found." };
    if (existing.status === "SENT" || existing.status === "SENDING") {
      return { ok: false, message: "This campaign has already been sent." };
    }
    await prisma.emailCampaign.update({
      where: { id },
      data: { ...data, scheduledAt, status: scheduledAt ? "SCHEDULED" : "DRAFT" },
    });
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${id}`);
    return { ok: true, message: scheduledAt ? "Campaign scheduled." : "Draft saved." };
  }

  const created = await prisma.emailCampaign.create({
    data: { ...data, scheduledAt, status: scheduledAt ? "SCHEDULED" : "DRAFT" },
  });
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${created.id}`);
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign || campaign.status === "SENT" || campaign.status === "SENDING") return;
  await prisma.emailCampaign.delete({ where: { id } });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function testSendCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return { ok: false, message: "Save the campaign first." };

  const emailInput = String(formData.get("testEmail") ?? "").trim();
  const target = emailInput || session.user.email;
  const parsed = z.string().email().safeParse(target);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address to test to." };

  const html = renderCampaignHtml(campaign.htmlBody, {
    firstName: firstNameOf(session.user.name ?? null, parsed.data),
    unsubscribeUrl: unsubscribeUrl(session.user.id),
  });
  const result = await sendEmail({
    to: parsed.data,
    subject: `[Test] ${campaign.subject}`,
    html,
  });
  return result.ok
    ? { ok: true, message: `Test sent to ${parsed.data}.` }
    : { ok: false, message: `Test send failed: ${result.error}` };
}

export async function sendCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return { ok: false, message: "Campaign not found." };
  if (campaign.status === "SENT") return { ok: false, message: "Already sent." };

  const { sent, failed } = await dispatchCampaign(id);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  return {
    ok: true,
    message: `Campaign sent, ${sent} delivered, ${failed} failed.`,
  };
}
