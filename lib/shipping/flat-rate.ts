import type { RateProvider, ShippingOption, ShippingQuery } from "./types";

export const flatRateProvider: RateProvider = {
  name: "flat-rate",
  async quote(query: ShippingQuery): Promise<ShippingOption[] | null> {
    if (!/^\d{4}$/.test(query.postcode)) return null;
    const options: ShippingOption[] = [
      {
        id: "flat:standard",
        name: "Standard (Flat rate)",
        priceCents: 995,
        etaMinDays: 2,
        etaMaxDays: 8,
      },
    ];
    return options;
  },
};
