import type { Metadata } from "next";
import Link from "next/link";
import { ElementTile } from "@/components/ui";

export const metadata: Metadata = { title: "Check your email" };

export default function MagicLinkSentPage() {
  return (
    <div className="border border-mist bg-white p-6 text-center sm:p-8">
      <ElementTile symbol="✉" size="lg" tone="ghost" className="mx-auto" />
      <h1 className="mt-4 font-display text-xl font-bold">Check your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        If an account exists for that address, a one-time sign-in link is on its way. It expires in
        15 minutes.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-slate underline underline-offset-2 hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
