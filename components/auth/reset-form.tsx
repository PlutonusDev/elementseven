"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Alert, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, null);

  return (
    <div className="border border-mist bg-white p-6 sm:p-8">
      <h1 className="font-display text-xl font-bold">Choose a new password</h1>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1.5 text-xs text-slate">At least 8 characters.</p>
        </div>
        {state?.message && <Alert tone="error">{state.message}</Alert>}
        <SubmitButton className="w-full" pendingText="Updating…">
          Set new password
        </SubmitButton>
      </form>
    </div>
  );
}
