"use client";

import { useActionState, useState } from "react";
import { deleteAddressAction, saveAddressAction } from "@/lib/actions/account";
import { AU_STATES } from "@/lib/validation";
import type { SavedAddress } from "@/components/store/checkout-form";
import { Alert, Badge, buttonClass, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type EditableAddress = SavedAddress & { isDefault: boolean };

function AddressForm({
  address,
  onDone,
}: {
  address: EditableAddress | null;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(saveAddressAction, null);

  return (
    <form action={formAction} className="border border-mist bg-white p-5">
      <h3 className="font-display text-base font-bold">
        {address ? `Edit ${address.label}` : "Add a new address"}
      </h3>
      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ad-label">Label</Label>
          <Input id="ad-label" name="label" placeholder="Home, Work…" required defaultValue={address?.label ?? ""} />
        </div>
        <div>
          <Label htmlFor="ad-name">Full name</Label>
          <Input id="ad-name" name="fullName" autoComplete="name" required defaultValue={address?.fullName ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ad-line1">Street address</Label>
          <Input id="ad-line1" name="line1" autoComplete="address-line1" required defaultValue={address?.line1 ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ad-line2">Apartment, unit, etc. (optional)</Label>
          <Input id="ad-line2" name="line2" autoComplete="address-line2" defaultValue={address?.line2 ?? ""} />
        </div>
        <div>
          <Label htmlFor="ad-suburb">Suburb</Label>
          <Input id="ad-suburb" name="suburb" required defaultValue={address?.suburb ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ad-state">State</Label>
            <Select id="ad-state" name="state" required defaultValue={address?.state ?? "NSW"}>
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ad-postcode">Postcode</Label>
            <Input
              id="ad-postcode"
              name="postcode"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              defaultValue={address?.postcode ?? ""}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ad-phone">Phone (optional)</Label>
          <Input id="ad-phone" name="phone" type="tel" defaultValue={address?.phone ?? ""} />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="size-4 accent-ink"
        />
        Use as my default address
      </label>

      {state?.message && (
        <Alert tone={state.ok ? "success" : "error"} className="mt-4">
          {state.message}
        </Alert>
      )}

      <div className="mt-5 flex gap-3">
        <SubmitButton pendingText="Saving…">Save address</SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-slate underline underline-offset-2 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: EditableAddress[] }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editing === address.id ? (
          <AddressForm key={address.id} address={address} onDone={() => setEditing(null)} />
        ) : (
          <div
            key={address.id}
            className="flex flex-wrap items-start justify-between gap-4 border border-mist bg-white p-5"
          >
            <div className="text-sm">
              <p className="flex items-center gap-2 font-medium">
                {address.label}
                {address.isDefault && <Badge tone="accent">Default</Badge>}
              </p>
              <p className="mt-1.5 leading-relaxed text-slate">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.suburb} {address.state} {address.postcode}
              </p>
            </div>
            <div className="flex gap-4 text-[13px]">
              <button
                type="button"
                onClick={() => setEditing(address.id)}
                className="text-slate underline underline-offset-2 hover:text-ink"
              >
                Edit
              </button>
              <form action={deleteAddressAction}>
                <input type="hidden" name="id" value={address.id} />
                <button
                  type="submit"
                  className="text-slate underline underline-offset-2 hover:text-alert"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <AddressForm address={null} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing("new")} className={buttonClass("secondary")}>
          Add address
        </button>
      )}
    </div>
  );
}
