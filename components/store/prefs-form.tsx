"use client";

import { useActionState } from "react";
import { updateMarketingAction } from "@/lib/actions/account";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function PrefsForm({ optedIn }: { optedIn: boolean }) {
  const [state, formAction] = useActionState(updateMarketingAction, null);

  return (
    <form action={formAction} className="border border-mist bg-white p-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={optedIn}
          className="mt-0.5 size-4 accent-ink"
        />
        <span className="text-sm">
          <span className="font-medium">Send me marketing emails</span>
          <span className="mt-0.5 block text-slate">New stock, restocks and the occasional deal.</span>
        </span>
      </label>

      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-4">
          {state.message}
        </Alert>
      )}

      <div className="mt-5">
        <SubmitButton pendingText="Saving…">Save preference</SubmitButton>
      </div>
    </form>
  );
}
