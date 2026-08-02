"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Alert, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ForgotForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, null);

  return (
    <div className="border border-mist bg-white p-6 sm:p-8">
      <h1 className="font-display text-xl font-bold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate">
        Enter your email and we&apos;ll send a link to choose a new password.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="forgot-email">Email</Label>
          <Input id="forgot-email" name="email" type="email" autoComplete="email" required />
        </div>
        {state?.message && (
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        )}
        <SubmitButton className="w-full" pendingText="Sending…">
          Send reset link
        </SubmitButton>
      </form>

      <p className="mt-6 border-t border-mist pt-4 text-center text-sm">
        <Link href="/login" className="text-slate underline underline-offset-2 hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
