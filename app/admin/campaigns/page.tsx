import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { audienceCounts } from "@/lib/campaigns";
import { AdminCard, AdminPageHeader, StatCard, Td, Th } from "@/components/admin/ui";
import { Badge, buttonClass, type BadgeTone, EmptyState } from "@/components/ui";

export const metadata = { title: "Campaigns" };

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  SCHEDULED: "amber",
  SENDING: "accent",
  SENT: "ink",
};

const AUDIENCE_LABEL: Record<string, string> = {
  ALL_OPTED_IN: "All opted-in",
  HAS_ORDERED: "Has ordered",
  INACTIVE_60D: "Inactive 60 days",
};

export default async function AdminCampaignsPage() {
  const [campaigns, counts] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { recipients: true } },
        recipients: { where: { status: "SENT" }, select: { id: true } },
      },
    }),
    audienceCounts(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Campaigns"
        description="Compose and send marketing emails to opted-in customers"
        actions={
          <Link href="/admin/campaigns/new" className={buttonClass("primary", "sm")}>
            + New campaign
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="All opted-in" value={String(counts.ALL_OPTED_IN)} hint="Marketing subscribers" />
        <StatCard label="Have ordered" value={String(counts.HAS_ORDERED)} hint="≥1 paid order" />
        <StatCard label="Inactive 60d" value={String(counts.INACTIVE_60D)} hint="No recent orders" />
      </div>

      <AdminCard>
        {campaigns.length === 0 ? (
          <EmptyState
            symbol="Cm"
            title="No campaigns yet"
            body="Compose your first marketing email, you can preview and test-send before it goes out."
            action={
              <Link href="/admin/campaigns/new" className={buttonClass("primary", "sm")}>
                New campaign
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th>Audience</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Sent</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/campaigns/${c.id}`} className="font-medium hover:underline">
                        {c.subject}
                      </Link>
                    </Td>
                    <Td className="text-slate">{AUDIENCE_LABEL[c.audience]}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {c.status === "SENT" || c.status === "SENDING"
                        ? `${c.recipients.length}/${c._count.recipients}`
                        : "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-slate">{formatDateTime(c.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
