import Link from "next/link";
import { notFound } from "next/navigation";
import type { AccessStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";
import { SMOKING_STATUS_LABELS } from "@/lib/access-constants";
import { AccessDecision } from "@/components/admin/access-decision";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { Badge, type BadgeTone } from "@/components/ui";

export const metadata = { title: "Access request" };

const STATUS_TONE: Record<AccessStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "accent",
  DENIED: "alert",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-mist py-2.5 last:border-0">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default async function AccessRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.accessRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          createdAt: true,
          orders: { select: { totalCents: true }, where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
        },
      },
      decidedBy: { select: { name: true, email: true } },
    },
  });
  if (!request) notFound();

  const age = Math.floor(
    (Date.now() - request.dateOfBirth.getTime()) / (365.25 * 86400000),
  );

  return (
    <div>
      <AdminPageHeader
        title={request.user.name ?? request.user.email}
        description={`Submitted ${formatDateTime(request.createdAt)}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
            <Link href="/admin/access" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
              ← Access requests
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Application answers</h2>
            <dl className="mt-3 text-[13px]">
              <Row label="Date of birth" value={`${formatDate(request.dateOfBirth)} (age ${age})`} />
              <Row
                label="Currently smokes"
                value={SMOKING_STATUS_LABELS[request.smokingStatus] ?? request.smokingStatus}
              />
              {request.cigarettesPerDay !== null && (
                <Row label="Cigarettes per day" value={request.cigarettesPerDay} />
              )}
              {request.yearsSmoked !== null && (
                <Row label="Years smoked" value={request.yearsSmoked} />
              )}
              <Row label="Has vaped before" value={request.vapedBefore ? "Yes" : "No"} />
              <Row label="Wants to quit smoking with vaping" value={request.quitIntent ? "Yes" : "No"} />
              <Row
                label="Quit methods tried"
                value={request.aidsTried.length ? request.aidsTried.join(", ") : "—"}
              />
            </dl>
            {request.extraNotes && (
              <div className="mt-4 border-l-4 border-nitro bg-paper p-3">
                <p className="text-[11px] font-bold tracking-widest text-slate uppercase">
                  Customer note
                </p>
                <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line">
                  {request.extraNotes}
                </p>
              </div>
            )}
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="font-display text-sm font-bold">Decision</h2>
            {request.status === "PENDING" ? (
              <div className="mt-3">
                <AccessDecision requestId={request.id} />
              </div>
            ) : (
              <div className="mt-3 text-[13px]">
                <p>
                  <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                  <span className="ml-2 text-slate">
                    {request.decidedAt && `on ${formatDateTime(request.decidedAt)}`}
                    {request.decidedBy && ` by ${request.decidedBy.name ?? request.decidedBy.email}`}
                  </span>
                </p>
                {request.decisionNote && (
                  <p className="mt-2 border-l-4 border-mist pl-3 text-slate">{request.decisionNote}</p>
                )}
                <div className="mt-4 border-t border-mist pt-4">
                  <p className="mb-2 text-xs text-slate">Change this decision:</p>
                  <AccessDecision requestId={request.id} />
                </div>
              </div>
            )}
          </AdminCard>
        </div>

        <AdminCard className="h-fit p-5">
          <h2 className="font-display text-sm font-bold">Customer</h2>
          <dl className="mt-3 text-[13px]">
            <Row label="Email" value={request.user.email} />
            <Row label="Account created" value={formatDate(request.user.createdAt)} />
            <Row label="Paid orders" value={request.user.orders.length} />
            <Row
              label="Lifetime value"
              value={formatCents(request.user.orders.reduce((sum, o) => sum + o.totalCents, 0))}
            />
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}
