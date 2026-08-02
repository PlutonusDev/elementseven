import { getStoreSettings } from "@/lib/settings";
import { flatRateProvider } from "./flat-rate";
import { zoneTableProvider } from "./zone-table";
import type { RateProvider, ShippingOption, ShippingQuery } from "./types";

const providers: RateProvider[] = [zoneTableProvider, flatRateProvider];

export async function quoteShipping(query: ShippingQuery): Promise<ShippingOption[]> {
  let options: ShippingOption[] | null = null;
  for (const provider of providers) {
    options = await provider.quote(query);
    if (options?.length) break;
  }
  if (!options?.length) return [];

  const { freeShippingThresholdCents } = await getStoreSettings();
  if (freeShippingThresholdCents > 0 && query.subtotalCents >= freeShippingThresholdCents) {
    const cheapestIndex = options.reduce(
      (best, o, i) => (o.priceCents < options![best].priceCents ? i : best),
      0,
    );
    options = options.map((o, i) =>
      i === cheapestIndex ? { ...o, priceCents: 0, name: `Free ${o.name}` } : o,
    );
  }

  return options.sort((a, b) => a.priceCents - b.priceCents);
}

export type { ShippingOption, ShippingQuery } from "./types";
