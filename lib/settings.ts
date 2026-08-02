import { z } from "zod";
import { prisma } from "@/lib/db";
import { zonesSchema, type Zone } from "@/lib/shipping/types";

export const storeSettingsSchema = z.object({
  storeName: z.string().min(1),
  contactEmail: z.string().email(),
  freeShippingThresholdCents: z.number().int().min(0),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

const DEFAULT_STORE: StoreSettings = {
  storeName: "Element Seven",
  contactEmail: "hello@elementseven.net",
  freeShippingThresholdCents: 19500,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await prisma.setting.findUnique({ where: { key: "store" } });
  const parsed = storeSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_STORE;
}

export async function saveStoreSettings(value: StoreSettings): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "store" },
    update: { value },
    create: { key: "store", value },
  });
}

export async function getShippingZones(): Promise<Zone[]> {
  const row = await prisma.setting.findUnique({ where: { key: "shippingZones" } });
  const parsed = zonesSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : [];
}

export async function saveShippingZones(zones: Zone[]): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "shippingZones" },
    update: { value: zones },
    create: { key: "shippingZones", value: zones },
  });
}
