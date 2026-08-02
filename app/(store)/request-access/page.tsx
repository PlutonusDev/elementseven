import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
import { buttonClass, cx, ElementTile } from "@/components/ui";
import { AccessWizard } from "@/components/store/access-wizard";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Request access" };

function ReviewTimeline({
  submittedAt,
  decidedAt,
  denied,
}: {
  submittedAt: Date;
  decidedAt: Date | null;
  denied: boolean;
}) {
  const steps = [
    { label: "Submitted", at: submittedAt as Date | null, symbol: "✓" },
    { label: "Under review", at: decidedAt ? submittedAt : null, symbol: "Rv" },
    { label: denied ? "Decision" : "Approved", at: decidedAt, symbol: denied ? "!" : "Ap" },
  ];
  const currentIndex = decidedAt ? 3 : 1;

  return (
    <ol className="grid grid-cols-3">
      {steps.map((step, i) => {
        const complete = i < currentIndex || Boolean(step.at && i === 2);
        const active = !decidedAt && i === 1;
        return (
          <li key={step.label} className="relative flex flex-col items-center gap-2 text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cx(
                  "absolute top-4 left-[-50%] h-0.5 w-full",
                  i <= currentIndex - 1 ? "bg-ink" : "bg-mist",
                )}
              />
            )}
            <ElementTile
              symbol={step.symbol}
              size="sm"
              tone={complete ? (denied && i === 2 ? "amber" : "ink") : active ? "nitro" : "paper"}
              className="relative z-10"
            />
            <span className="px-1">
              <span className="block text-xs font-medium">{step.label}</span>
              <span className="mt-0.5 block text-[11px] text-slate">
                {i === 0 && formatDateTime(submittedAt)}
                {i === 1 && (active ? "Usually within 1 business day" : "Complete")}
                {i === 2 && (step.at ? formatDateTime(step.at) : "")}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [access, session, { submitted }] = await Promise.all([
    getAccess(),
    auth(),
    searchParams,
  ]);

  if (access.kind === "GUEST") {
    redirect("/register?next=%2Frequest-access");
  }

  if (access.kind === "PENDING") {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="animate-rise border-2 border-ink bg-white p-8 shadow-[6px_6px_0_0_var(--color-nitro)]">
          {submitted && (
            <span className="mb-4 inline-block -rotate-1 border-2 border-ink bg-amber px-2.5 py-1 text-[11px] font-bold tracking-widest uppercase">
              Application received
            </span>
          )}
          <h1 className="font-display text-3xl font-black tracking-tight">
            You&apos;re in the queue.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Our team personally reviews every application - most are decided within one business
            day. We&apos;ll email you the moment there&apos;s a decision.
          </p>
          <div className="mt-8 border-t-2 border-mist pt-6">
            <ReviewTimeline submittedAt={access.request.updatedAt} decidedAt={null} denied={false} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className={buttonClass("secondary")}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (access.kind === "APPROVED") {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="animate-rise border-2 border-ink bg-white p-8 shadow-[6px_6px_0_0_var(--color-amber)]">
          <ElementTile symbol="✓" size="lg" tone="ink" />
          <h1 className="mt-5 font-display text-3xl font-black tracking-tight">
            Account approved
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Welcome to Element Seven, your account has been approved.
          </p>
          {access.request?.decidedAt && (
            <p className="mt-2 text-xs text-slate">
              Approved {formatDateTime(access.request.decidedAt)}
            </p>
          )}
          <div className="mt-8">
            <Link href="/products" className={buttonClass("amber", "lg")}>
              Browse the range →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (access.kind === "DENIED") {
    return (
      <div className="mx-auto max-w-4xl py-16">
        <div className="animate-rise border-2 border-ink bg-white p-8 shadow-[6px_6px_0_0_var(--color-mist)]">
          <h1 className="font-display text-3xl font-black tracking-tight">
            Your application wasn&apos;t approved.
          </h1>
          {access.request.decisionNote && (
            <div className="mt-4 border-l-4 border-amber bg-paper p-4 text-sm leading-relaxed">
              <p className="text-[11px] font-bold tracking-widest text-slate uppercase">
                Reviewer note
              </p>
              <p className="mt-1.5">{access.request.decisionNote}</p>
            </div>
          )}
          <p className="mt-4 text-sm leading-relaxed text-slate">
            If your circumstances have changed or something was incomplete, you&apos;re welcome to
            apply again below.
          </p>
          <div className="mt-8 border-t-2 border-mist pt-8">
            <AccessWizard firstName={session?.user?.name?.split(/\s+/)[0] ?? ""} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 max-w-2xl">
          <span className="inline-block -rotate-1 border-2 border-ink bg-nitro px-2.5 py-1 text-[11px] font-bold tracking-widest text-paper uppercase">
            Access form
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            We need to get a few details from you before we open the doors.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate">
            In Australia, we require a few details before allowing the purchase of nicotine products. Answer a few
            questions, our team reviews your application (typically within just one business day!) and
            the full range will be available to you.
          </p>
        </div>
        <AccessWizard firstName={session?.user?.name?.split(/\s+/)[0] ?? ""} />
      </div>
    </div>
  );
}
