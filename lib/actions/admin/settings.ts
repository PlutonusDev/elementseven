"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { dollarsToCents } from "@/lib/format";
import { saveShippingZones, saveStoreSettings } from "@/lib/settings";
import { zonesSchema } from "@/lib/shipping/types";
import { zodMessage, type ActionState } from "../types";

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Enter a store name").max(80),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid contact email"),
  freeShippingThreshold: z
    .string()
    .trim()
    .refine((v) => v === "" || Number.isFinite(Number.parseFloat(v)), "Enter a valid amount"),
  zonesJson: z.string().min(2, "Zone table is required"),
});

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName"),
    contactEmail: formData.get("contactEmail"),
    freeShippingThreshold: formData.get("freeShippingThreshold") ?? "",
    zonesJson: formData.get("zonesJson"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  let zonesRaw: unknown;
  try {
    zonesRaw = JSON.parse(parsed.data.zonesJson);
  } catch {
    return { ok: false, message: "Shipping zones are not valid, check the zone editor." };
  }
  const zones = zonesSchema.safeParse(zonesRaw);
  if (!zones.success) {
    return { ok: false, message: `Zone table invalid: ${zodMessage(zones.error)}` };
  }

  const thresholdCents =
    parsed.data.freeShippingThreshold === ""
      ? 0
      : dollarsToCents(parsed.data.freeShippingThreshold);
  if (!Number.isFinite(thresholdCents) || thresholdCents < 0) {
    return { ok: false, message: "Enter a valid free-shipping threshold." };
  }

  await saveStoreSettings({
    storeName: parsed.data.storeName,
    contactEmail: parsed.data.contactEmail,
    freeShippingThresholdCents: thresholdCents,
  });
  await saveShippingZones(zones.data);

  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true, message: "Settings saved." };
}
