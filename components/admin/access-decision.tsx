"use client";

import { useActionState, useState } from "react";
import { decideAccessAction } from "@/lib/actions/admin/access";
import { Alert, Button, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AccessDecision({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(decideAccessAction, null);
  const [mode, setMode] = useState<"APPROVED" | "DENIED" | null>(null);

  if (state?.ok) {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <div>
      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setMode("APPROVED")}>
            Approve
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => setMode("DENIED")}>
            Deny
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="decision" value={mode} />
          <div>
            <Label htmlFor={`decision-note-${requestId}`}>
              {mode === "APPROVED" ? "Note (optional)" : "Reason shown to the customer (recommended)"}
            </Label>
            <Textarea
              id={`decision-note-${requestId}`}
              name="note"
              rows={3}
              maxLength={500}
              placeholder={
                mode === "APPROVED"
                  ? "Internal or customer-facing note…"
                  : "e.g. We couldn't verify your details, please reapply with…"
              }
            />
            <p className="mt-1 text-xs text-slate">
              The customer is emailed the decision{mode === "DENIED" ? " and this note" : ""}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton
              variant={mode === "DENIED" ? "danger" : "primary"}
              size="sm"
              pendingText="Saving…"
            >
              Confirm {mode === "APPROVED" ? "approval" : "denial"}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {state?.message && !state.ok && (
        <Alert tone="error" className="mt-3">
          {state.message}
        </Alert>
      )}
    </div>
  );
}
