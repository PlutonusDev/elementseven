"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Alert, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);

  return (
    <div className="border border-mist bg-white p-6 sm:p-8">
      <h1 className="font-display text-xl font-bold">Create an account</h1>
      <p className="mt-1.5 text-sm text-slate">
        Track orders, save addresses, check out faster.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="reg-name">Name</Label>
          <Input id="reg-name" name="name" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1.5 text-xs text-slate">At least 8 characters.</p>
        </div>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="marketingOptIn" className="mt-0.5 size-4 accent-ink" />
          <span className="text-slate">
            Email me about new stock and deals (unsubscribe anytime)
          </span>
        </label>

        {state?.message && <Alert tone="error">{state.message}</Alert>}

        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 border-t border-mist pt-4 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
