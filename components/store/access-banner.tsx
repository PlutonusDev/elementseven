import Link from "next/link";
import { getAccess } from "@/lib/access";

export async function AccessBanner() {
  const access = await getAccess();
  if (access.kind === "APPROVED") return null;

  const content = {
    GUEST: {
      text: "This range is access-controlled. Create an account and apply to unlock products & pricing.",
      cta: "Apply for access →",
      href: "/request-access",
    },
    NONE: {
      text: "One step left - submit your access application to unlock the full range.",
      cta: "Apply now →",
      href: "/request-access",
    },
    PENDING: {
      text: "Your access application is under review - we'll email you the decision.",
      cta: "View status",
      href: "/request-access",
    },
    DENIED: {
      text: "Your access application wasn't approved.",
      cta: "Review & reapply",
      href: "/request-access",
    },
  }[access.kind];

  return (
    <div className="border-b-2 border-ink bg-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <p className="text-[13px] text-paper/85">
          <span aria-hidden="true" className="mr-2">
            {access.kind === "PENDING" ? "⏳" : "🔒"}
          </span>
          {content.text}
        </p>
        <Link
          href={content.href}
          className="text-[13px] font-bold text-amber underline-offset-2 hover:underline"
        >
          {content.cta}
        </Link>
      </div>
    </div>
  );
}
