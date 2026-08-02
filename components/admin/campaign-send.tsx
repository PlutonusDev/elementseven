"use client";

import { useActionState, useState } from "react";
import {
  deleteCampaignAction,
  sendCampaignAction,
  testSendCampaignAction,
} from "@/lib/actions/admin/campaigns";
import { Alert, Button, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function CampaignSend({
  campaignId,
  audienceCount,
  sent,
  adminEmail,
}: {
  campaignId: string;
  audienceCount: number;
  sent: boolean;
  adminEmail: string;
}) {
  const [testState, testAction] = useActionState(testSendCampaignAction, null);
  const [sendState, sendAction] = useActionState(sendCampaignAction, null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold">Test send</h3>
        <p className="mt-1 text-xs text-slate">
          Sends a copy of this campaign to any address so you can preview it in a real inbox.
        </p>
        <form action={testAction} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={campaignId} />
          <Input
            type="email"
            name="testEmail"
            defaultValue={adminEmail}
            placeholder="you@example.com"
            aria-label="Test recipient email"
            className="w-auto flex-1 text-[13px]"
          />
          <SubmitButton variant="secondary" size="sm" pendingText="Sending…">
            Send test
          </SubmitButton>
        </form>
        {testState?.message && (
          <Alert tone={testState.ok ? "success" : "error"} className="mt-2">
            {testState.message}
          </Alert>
        )}
      </div>

      <div className="border-t border-mist pt-4">
        <h3 className="text-[13px] font-semibold">Send campaign</h3>
        {sent ? (
          <p className="mt-1 text-xs text-slate">This campaign has been sent.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate">
              Sends to {audienceCount} recipient{audienceCount === 1 ? "" : "s"} in batches. This
              can&apos;t be undone.
            </p>
            {!confirming ? (
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => setConfirming(true)}
                disabled={audienceCount === 0}
              >
                Send now
              </Button>
            ) : (
              <form action={sendAction} className="mt-2 flex items-center gap-3">
                <input type="hidden" name="id" value={campaignId} />
                <SubmitButton size="sm" pendingText="Sending…">
                  Confirm send to {audienceCount}
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
        {sendState?.message && (
          <Alert tone={sendState.ok ? "success" : "error"} className="mt-2">
            {sendState.message}
          </Alert>
        )}
      </div>

      {!sent && (
        <div className="border-t border-mist pt-4">
          <form action={deleteCampaignAction}>
            <input type="hidden" name="id" value={campaignId} />
            <button
              type="submit"
              className="text-[13px] text-slate underline underline-offset-2 hover:text-alert"
            >
              Delete this draft
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
