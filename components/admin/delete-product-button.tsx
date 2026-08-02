"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/actions/types";
import { Alert, Button } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function DeleteProductButton({
  action,
  productId,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  productId: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <>
        <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
          Delete product
        </Button>
        {state?.message && !state.ok && (
          <Alert tone="error" className="mt-3">
            {state.message}
          </Alert>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={productId} />
      <span className="text-[13px] font-medium">Delete this product permanently?</span>
      <SubmitButton variant="danger" size="sm" pendingText="Deleting…">
        Yes, delete
      </SubmitButton>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
      >
        Cancel
      </button>
      {state?.message && !state.ok && (
        <Alert tone="error" className="w-full">
          {state.message}
        </Alert>
      )}
    </form>
  );
}
