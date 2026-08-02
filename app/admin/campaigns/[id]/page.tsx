import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { audienceCounts, audienceWhere } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { renderCampaignHtml } from "@/lib/email/templates";
import { AdminCard, AdminPageHeader, Td, Th } from "@/components/admin/ui";
import { CampaignEditor } from "@/components/admin/campaign-editor";
import { CampaignSend } from "@/components/admin/campaign-send";
import { Badge, type BadgeTone } from "@/components/ui";

export const metadata = { title: "Edit campaign" };

const RECIPIENT_TONE: Record<string, BadgeTone> = {
  PENDING: "neutral",
  SENT: "accent",
  FAILED: "alert",
};

function toLocalInput(date: Date | null): string | null {
  if (!date) return null;
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, counts] = await Promise.all([
    prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        recipients: { orderBy: { email: "asc" }, take: 200 },
        _count: { select: { recipients: true } },
      },
    }),
    audienceCounts(),
  ]);
  if (!campaign) notFound();

  const session = await auth();
  const locked = campaign.status === "SENT" || campaign.status === "SENDING";
  const audienceCount = await prisma.user.count({ where: audienceWhere(campaign.audience) });
  const previewHtml = renderCampaignHtml(campaign.htmlBody, {
    firstName: "Alex",
    unsubscribeUrl: "#unsubscribe-preview",
  });

  const sentCount = campaign.recipients.filter((r) => r.status === "SENT").length;
  const failedCount = campaign.recipients.filter((r) => r.status === "FAILED").length;

  return (
    <div>
      <AdminPageHeader
        title={campaign.subject}
        description={`Status: ${campaign.status}`}
        actions={
          <Link href="/admin/campaigns" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
            ← Campaigns
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <CampaignEditor
            campaign={{
              id: campaign.id,
              subject: campaign.subject,
              htmlBody: campaign.htmlBody,
              audience: campaign.audience,
              scheduledAt: toLocalInput(campaign.scheduledAt),
              locked,
            }}
            counts={counts}
          />

          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Preview</h2>
            <p className="mt-1 text-xs text-slate">Rendered with sample data (first name &ldquo;Alex&rdquo;).</p>
            <iframe
              title="Campaign preview"
              srcDoc={previewHtml}
              className="mt-3 h-[520px] w-full border border-mist bg-white"
            />
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Delivery</h2>
            <div className="mt-3">
              <CampaignSend
                campaignId={campaign.id}
                audienceCount={audienceCount}
                sent={campaign.status === "SENT"}
                adminEmail={session?.user?.email ?? ""}
              />
            </div>
          </AdminCard>

          {campaign._count.recipients > 0 && (
            <AdminCard>
              <div className="flex items-center justify-between border-b border-mist px-4 py-3">
                <h2 className="font-display text-sm font-bold">Recipient log</h2>
                <span className="text-xs text-slate tabular-nums">
                  {sentCount} sent · {failedCount} failed
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <Th>Email</Th>
                      <Th>Status</Th>
                      <Th>Sent</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.recipients.map((r) => (
                      <tr key={r.id}>
                        <Td className="text-[13px]">{r.email}</Td>
                        <Td>
                          <Badge tone={RECIPIENT_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                          {r.error && <span className="block text-[11px] text-alert">{r.error}</span>}
                        </Td>
                        <Td className="whitespace-nowrap text-xs text-slate">
                          {r.sentAt ? formatDateTime(r.sentAt) : "—"}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
