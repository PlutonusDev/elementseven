import { getShippingZones } from "@/lib/settings";
import type { RateProvider, ShippingOption, ShippingQuery, Zone, ZoneService } from "./types";

function priceForWeight(service: ZoneService, weightGrams: number): number | null {
  const sorted = [...service.brackets].sort((a, b) => {
    if (a.maxGrams === null) return 1;
    if (b.maxGrams === null) return -1;
    return a.maxGrams - b.maxGrams;
  });
  for (const bracket of sorted) {
    if (bracket.maxGrams === null || weightGrams <= bracket.maxGrams) {
      return bracket.priceCents;
    }
  }
  return null;
}

function zoneForPostcode(zones: Zone[], postcode: string): Zone | null {
  const code = Number.parseInt(postcode, 10);
  if (!Number.isFinite(code)) return null;
  for (const zone of zones) {
    if (zone.ranges.some(([min, max]) => code >= min && code <= max)) return zone;
  }
  return null;
}

export const zoneTableProvider: RateProvider = {
  name: "zone-table",
  async quote(query: ShippingQuery): Promise<ShippingOption[] | null> {
    const zones = await getShippingZones();
    const zone = zoneForPostcode(zones, query.postcode);
    if (!zone) return null;
    const options: ShippingOption[] = [];
    for (const service of zone.services) {
      const priceCents = priceForWeight(service, query.weightGrams);
      if (priceCents === null) continue;
      options.push({
        id: `${zone.id}:${service.id}`,
        name: `${service.name} (${zone.name})`,
        priceCents,
        etaMinDays: service.etaMinDays,
        etaMaxDays: service.etaMaxDays,
      });
    }
    return options.length ? options : null;
  },
};
