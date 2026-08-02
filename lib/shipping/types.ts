import { z } from "zod";

export interface ShippingQuery {
  postcode: string;
  weightGrams: number;
  subtotalCents: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  priceCents: number;
  etaMinDays: number;
  etaMaxDays: number;
}

export interface RateProvider {
  name: string;
  quote(query: ShippingQuery): Promise<ShippingOption[] | null>;
}

export const bracketSchema = z.object({
  maxGrams: z.number().int().positive().nullable(),
  priceCents: z.number().int().min(0),
});

export const zoneServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  etaMinDays: z.number().int().min(0),
  etaMaxDays: z.number().int().min(0),
  brackets: z.array(bracketSchema).min(1),
});

export const zoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ranges: z.array(z.tuple([z.number().int().min(0), z.number().int().max(9999)])).min(1),
  services: z.array(zoneServiceSchema).min(1),
});

export const zonesSchema = z.array(zoneSchema);

export type Zone = z.infer<typeof zoneSchema>;
export type ZoneService = z.infer<typeof zoneServiceSchema>;

export function etaText(option: Pick<ShippingOption, "etaMinDays" | "etaMaxDays">): string {
  if (option.etaMinDays === option.etaMaxDays) {
    return `${option.etaMinDays} business day${option.etaMinDays === 1 ? "" : "s"}`;
  }
  return `${option.etaMinDays}–${option.etaMaxDays} business days`;
}
