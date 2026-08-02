import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PrefsForm } from "@/components/store/prefs-form";

export const metadata: Metadata = { title: "Email preferences" };

export default async function PreferencesPage() {
  const session = await requireUser("/account/preferences");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Link href="/account" className="text-[13px] text-slate hover:text-ink">
        ← Back to account
      </Link>
      <h1 className="mt-4 font-display text-3xl font-black tracking-tight">Email preferences</h1>
      <div className="mt-8">
        <PrefsForm optedIn={user?.marketingOptIn ?? false} />
      </div>
    </div>
  );
}
