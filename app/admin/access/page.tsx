import Link from "next/link";
import type { AccessStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { SMOKING_STATUS_LABELS } from "@/lib/access-constants";
import { AdminCard, AdminPageHeader, StatCard, Td, Th } from "@/components/admin/ui";
import { Badge, type BadgeTone, cx, EmptyState } from "@/components/ui";

export const metadata = { title: "Access requests" };

const STATUS_TONE: Record<AccessStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "accent",
  DENIED: "alert",
};

const TABS: Array<{ value: AccessStatus | "ALL"; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "ALL", label: "All" },
];

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === sp.status)?.value ?? "PENDING";

  const [requests, counts] = await Promise.all([
    prisma.accessRequest.findMany({
      where: tab === "ALL" ? {} : { status: tab },
      include: { user: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.accessRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (status: AccessStatus) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  return (
    <div>
      <AdminPageHeader
        title="Access requests"
        description="Review customer applications before they can view or buy products"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Awaiting review" value={String(countFor("PENDING"))} hint="Oldest first below" />
        <StatCard label="Approved" value={String(countFor("APPROVED"))} />
        <StatCard label="Denied" value={String(countFor("DENIED"))} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "PENDING" ? "/admin/access" : `/admin/access?status=${t.value}`}
            className={cx(
              "border px-3 py-1.5 text-[13px] transition-colors",
              tab === t.value ? "border-ink bg-ink text-paper" : "border-mist bg-white hover:border-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <AdminCard>
        {requests.length === 0 ? (
          <EmptyState
            symbol="Ac"
            title={tab === "PENDING" ? "Queue is clear" : "Nothing here"}
            body={
              tab === "PENDING"
                ? "No applications waiting for review. New ones appear here the moment they're submitted."
                : "No applications match this view."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Submitted</Th>
                  <Th>Smokes</Th>
                  <Th>Quit intent</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Review</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/access/${request.id}`} className="font-medium hover:underline">
                        {request.user.name ?? request.user.email}
                      </Link>
                      <span className="block text-xs text-slate">{request.user.email}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-slate">{formatDateTime(request.createdAt)}</Td>
                    <Td className="text-slate">
                      {SMOKING_STATUS_LABELS[request.smokingStatus] ?? request.smokingStatus}
                    </Td>
                    <Td>{request.quitIntent ? "Yes" : "No"}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/access/${request.id}`}
                        className="text-[13px] text-nitro underline underline-offset-2"
                      >
                        Open →
                      </Link>
                    </Td>
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
