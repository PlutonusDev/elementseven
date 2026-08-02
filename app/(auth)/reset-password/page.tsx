import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/reset-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="border border-mist bg-white p-6 sm:p-8">
        <Alert tone="error">
          This reset link is missing its token.{" "}
          <Link href="/forgot-password" className="font-medium underline underline-offset-2">
            Request a new one
          </Link>
          .
        </Alert>
      </div>
    );
  }

  return <ResetForm token={token} />;
}
