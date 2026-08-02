"use client";

import { useActionState, useState } from "react";
import { CampaignAudience } from "@prisma/client";
import { saveCampaignAction } from "@/lib/actions/admin/campaigns";
import { Alert, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type EditorCampaign = {
  id: string;
  subject: string;
  htmlBody: string;
  audience: CampaignAudience;
  scheduledAt: string | null;
  locked: boolean;
};

const AUDIENCES: Array<{ value: CampaignAudience; label: string }> = [
  { value: "ALL_OPTED_IN", label: "All opted-in subscribers" },
  { value: "HAS_ORDERED", label: "Customers with ≥1 order" },
  { value: "INACTIVE_60D", label: "No orders in 60 days" },
];

const SAMPLE_BODY = `<p>Hi {{first_name}},</p>
<p>We've just restocked a few crowd favourites and added two new flavours to the Alto salts range.</p>
<p><a href="https://example.com/products">Shop the new arrivals</a></p>
<p>The Element Seven team</p>`;

export function CampaignEditor({
  campaign,
  counts,
}: {
  campaign: EditorCampaign | null;
  counts: Record<CampaignAudience, number>;
}) {
  const [state, formAction] = useActionState(saveCampaignAction, null);
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [body, setBody] = useState(campaign?.htmlBody ?? SAMPLE_BODY);
  const [audience, setAudience] = useState<CampaignAudience>(campaign?.audience ?? "ALL_OPTED_IN");
  const [schedule, setSchedule] = useState(campaign?.scheduledAt ?? "");

  const locked = campaign?.locked ?? false;

  return (
    <form action={formAction} className="space-y-4 border border-mist bg-white p-5">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <h2 className="font-display text-sm font-bold">Compose</h2>

      <div>
        <Label htmlFor="ce-subject">Subject</Label>
        <Input
          id="ce-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={locked}
          required
        />
      </div>

      <div>
        <Label htmlFor="ce-body">HTML body</Label>
        <Textarea
          id="ce-body"
          name="htmlBody"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={locked}
          rows={12}
          className="font-mono text-[13px]"
          required
        />
        <p className="mt-1.5 text-xs text-slate">
          Merge tags:{" "}
          <code className="bg-paper px-1">{"{{first_name}}"}</code> and{" "}
          <code className="bg-paper px-1">{"{{unsubscribe_url}}"}</code>. A branded header, footer and
          unsubscribe link are added automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ce-audience">Audience</Label>
          <Select
            id="ce-audience"
            name="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as CampaignAudience)}
            disabled={locked}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} ({counts[a.value]})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ce-schedule">Schedule (optional)</Label>
          <Input
            id="ce-schedule"
            name="scheduledAt"
            type="datetime-local"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            disabled={locked}
          />
          <p className="mt-1.5 text-xs text-slate">Leave blank to keep as a draft.</p>
        </div>
      </div>

      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      {!locked && (
        <SubmitButton pendingText="Saving…">
          {campaign ? "Save campaign" : "Create campaign"}
        </SubmitButton>
      )}
      {locked && (
        <p className="text-[13px] text-slate">
          This campaign has been sent and can no longer be edited.
        </p>
      )}
    </form>
  );
}
