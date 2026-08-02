"use client";

import { useActionState, useState } from "react";
import { updateSettingsAction } from "@/lib/actions/admin/settings";
import { Alert, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function SettingsForm({
  storeName,
  contactEmail,
  freeShippingThreshold,
  zonesJson,
}: {
  storeName: string;
  contactEmail: string;
  freeShippingThreshold: string;
  zonesJson: string;
}) {
  const [state, formAction] = useActionState(updateSettingsAction, null);
  const [zones, setZones] = useState(zonesJson);

  function format() {
    try {
      setZones(JSON.stringify(JSON.parse(zones), null, 2));
    } catch {
      /* leave as-is if invalid */
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4 border border-mist bg-white p-5">
        <h2 className="font-display text-sm font-bold">Store</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-name">Store name</Label>
            <Input id="s-name" name="storeName" defaultValue={storeName} required />
          </div>
          <div>
            <Label htmlFor="s-email">Contact email</Label>
            <Input id="s-email" name="contactEmail" type="email" defaultValue={contactEmail} required />
          </div>
        </div>
        <div className="max-w-xs">
          <Label htmlFor="s-threshold">Free shipping threshold (A$)</Label>
          <Input
            id="s-threshold"
            name="freeShippingThreshold"
            inputMode="decimal"
            defaultValue={freeShippingThreshold}
            placeholder="0 to disable"
          />
          <p className="mt-1 text-xs text-slate">
            Orders at or above this subtotal get the cheapest shipping option free. Set to 0 to
            disable.
          </p>
        </div>
      </section>

      <section className="space-y-3 border border-mist bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold">Shipping zone table</h2>
          <button
            type="button"
            onClick={format}
            className="text-[13px] text-slate underline underline-offset-2 hover:text-ink"
          >
            Format JSON
          </button>
        </div>
        <p className="text-xs text-slate">
          Each zone has a name, an array of postcode ranges (<code className="bg-paper px-1">[min, max]</code>
          ), and services with weight-based price brackets. The zone-table provider matches a
          destination postcode against these ranges; the flat-rate provider is the fallback.
        </p>
        <textarea
          name="zonesJson"
          value={zones}
          onChange={(e) => setZones(e.target.value)}
          spellCheck={false}
          rows={20}
          className="w-full border border-mist bg-white px-3 py-2 font-mono text-[12px] leading-relaxed focus:border-ink"
          required
        />
      </section>

      {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}
