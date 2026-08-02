import type { CampaignAudience, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { renderCampaignHtml } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

const ACTIVE_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export function audienceWhere(audience: CampaignAudience): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = { marketingOptIn: true };
  if (audience === "HAS_ORDERED") {
    return { ...base, orders: { some: { status: { in: [...ACTIVE_ORDER_STATUSES] } } } };
  }
  if (audience === "INACTIVE_60D") {
    const cutoff = new Date(Date.now() - 60 * 86400000);
    return { ...base, orders: { none: { createdAt: { gte: cutoff } } } };
  }
  return base;
}

export async function audienceCounts(): Promise<Record<CampaignAudience, number>> {
  const [all, ordered, inactive] = await Promise.all([
    prisma.user.count({ where: audienceWhere("ALL_OPTED_IN") }),
    prisma.user.count({ where: audienceWhere("HAS_ORDERED") }),
    prisma.user.count({ where: audienceWhere("INACTIVE_60D") }),
  ]);
  return { ALL_OPTED_IN: all, HAS_ORDERED: ordered, INACTIVE_60D: inactive };
}

export function firstNameOf(name: string | null, email: string): string {
  const first = name?.trim().split(/\s+/)[0];
  return first || email.split("@")[0] || "there";
}

const BATCH_SIZE = 20;

export async function dispatchCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "SENT") return { sent: 0, failed: 0 };

  const users = await prisma.user.findMany({
    where: audienceWhere(campaign.audience),
    select: { id: true, email: true },
  });

  if (users.length > 0) {
    await prisma.campaignRecipient.createMany({
      data: users.map((u) => ({ campaignId, userId: u.id, email: u.email })),
      skipDuplicates: true,
    });
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  let sent = 0;
  let failed = 0;

  for (;;) {
    const batch = await prisma.campaignRecipient.findMany({
      where: { campaignId, status: "PENDING" },
      include: { user: { select: { name: true, marketingOptIn: true } } },
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
    });
    if (batch.length === 0) break;

    await Promise.all(
      batch.map(async (recipient) => {
        if (!recipient.user.marketingOptIn) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "FAILED", error: "Recipient opted out before send" },
          });
          failed++;
          return;
        }
        const html = renderCampaignHtml(campaign.htmlBody, {
          firstName: firstNameOf(recipient.user.name, recipient.email),
          unsubscribeUrl: unsubscribeUrl(recipient.userId),
        });
        const result = await sendEmail({ to: recipient.email, subject: campaign.subject, html });
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: result.ok
            ? { status: "SENT", sentAt: new Date(), error: null }
            : { status: "FAILED", error: result.error ?? "Send failed" },
        });
        result.ok ? sent++ : failed++;
      }),
    );
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENT", sentAt: new Date() },
  });

  return { sent, failed };
}

export async function dispatchDueCampaigns(): Promise<void> {
  const due = await prisma.emailCampaign.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    select: { id: true },
  });
  for (const campaign of due) {
    await dispatchCampaign(campaign.id);
  }
}
