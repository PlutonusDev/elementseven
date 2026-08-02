import { Category, OrderStatus, PrismaClient, StockReason } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

type SeedVariant = {
  flavour?: string;
  strengthMg?: number;
  priceCents?: number;
  stockQty: number;
  weightGrams: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  brand: string;
  category: Category;
  basePriceCents: number;
  featured?: boolean;
  description: string;
  imageCount: number;
  skuPrefix: string;
  variants: SeedVariant[];
};

function crossVariants(
  flavours: string[],
  strengths: number[],
  stock: () => number,
  weightGrams: number,
): SeedVariant[] {
  const out: SeedVariant[] = [];
  for (const flavour of flavours) {
    for (const strengthMg of strengths) {
      out.push({ flavour, strengthMg, stockQty: stock(), weightGrams });
    }
  }
  return out;
}

let stockSeed = 7;
function nextStock(min: number, max: number) {
  stockSeed = (stockSeed * 48271) % 2147483647;
  return min + (stockSeed % (max - min + 1));
}

function skuFor(prefix: string, v: SeedVariant, index: number) {
  const flavourPart = v.flavour
    ? v.flavour
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .map((w) => w.slice(0, 3).toUpperCase())
        .join("")
        .slice(0, 6)
    : "STD";
  const strengthPart = v.strengthMg != null ? String(v.strengthMg) : String(index + 1).padStart(2, "0");
  return `${prefix}-${flavourPart}-${strengthPart}`;
}

const products: SeedProduct[] = [
  {
    name: "Cirro Bar 8000",
    slug: "cirro-bar-8000",
    brand: "Cirro",
    category: "DISPOSABLES",
    basePriceCents: 3295,
    featured: true,
    skuPrefix: "CIR8K",
    imageCount: 3,
    description:
      "An 8,000-puff disposable with a mesh coil and adjustable airflow. Consistent flavour from the first draw to the last, with a USB-C port so the battery never outlasts the liquid. Compact enough for a jacket pocket, solid enough not to rattle in one.",
    variants: crossVariants(
      ["Watermelon Ice", "Grape Burst", "Blue Razz", "Mint Frost"],
      [50],
      () => nextStock(8, 60),
      48,
    ),
  },
  {
    name: "Nimbus Air 6000",
    slug: "nimbus-air-6000",
    brand: "Nimbus",
    category: "DISPOSABLES",
    basePriceCents: 2795,
    skuPrefix: "NIM6K",
    imageCount: 2,
    description:
      "Nimbus's mid-range disposable pairs a soft-touch shell with a tight, cigarette-style draw. Two strengths across three well-balanced fruit profiles — nothing cloying, nothing washed out.",
    variants: crossVariants(
      ["Mango Peach", "Strawberry Kiwi", "Cola Ice"],
      [35, 50],
      () => nextStock(4, 40),
      42,
    ),
  },
  {
    name: "Cirro Pocket 2500",
    slug: "cirro-pocket-2500",
    brand: "Cirro",
    category: "DISPOSABLES",
    basePriceCents: 1995,
    skuPrefix: "CIRPK",
    imageCount: 2,
    description:
      "The smallest device Cirro makes. 2,500 puffs in a credit-card footprint, aimed at people who want tobacco or menthol and nothing else. No screen, no buttons, no fuss.",
    variants: crossVariants(["Tobacco Gold", "Menthol Arctic"], [50], () => nextStock(10, 50), 32),
  },
  {
    name: "Halo Puff Mini",
    slug: "halo-puff-mini",
    brand: "Halo",
    category: "DISPOSABLES",
    basePriceCents: 1495,
    skuPrefix: "HALMN",
    imageCount: 2,
    description:
      "An entry-level disposable at an honest price. Around 1,500 puffs, a firm mouth-to-lung draw and two straightforward flavours. A sensible way to try a profile before committing to a larger device.",
    variants: crossVariants(["Pineapple Ice", "Berry Mix"], [25, 50], () => nextStock(0, 35), 28),
  },
  {
    name: "Vaporesso XROS 4",
    slug: "vaporesso-xros-4",
    brand: "Vaporesso",
    category: "POD_SYSTEMS",
    basePriceCents: 5495,
    featured: true,
    skuPrefix: "VXR4",
    imageCount: 3,
    description:
      "The fourth-generation XROS refines what was already the benchmark pod system: a 1000mAh cell, top-fill 3mL pods, and Vaporesso's COREX mesh for genuinely even heat. Auto-draw or button fire, with adjustable airflow that actually changes the draw.",
    variants: [
      { flavour: "Black", stockQty: nextStock(6, 30), weightGrams: 180 },
      { flavour: "Silver", stockQty: nextStock(6, 30), weightGrams: 180 },
      { flavour: "Sage", stockQty: nextStock(0, 20), weightGrams: 180 },
    ],
  },
  {
    name: "Uwell Caliburn G3",
    slug: "uwell-caliburn-g3",
    brand: "Uwell",
    category: "POD_SYSTEMS",
    basePriceCents: 4995,
    skuPrefix: "UWCG3",
    imageCount: 3,
    description:
      "Uwell's Caliburn line has earned its reputation for flavour, and the G3 keeps it: Pro-FOCS airflow, a crisp 25W maximum, and pods that click in with a reassuring snap. The everyday device we recommend most often.",
    variants: [
      { flavour: "Black", stockQty: nextStock(8, 35), weightGrams: 168 },
      { flavour: "Navy", stockQty: nextStock(4, 25), weightGrams: 168 },
      { flavour: "Grey", stockQty: nextStock(2, 25), weightGrams: 168 },
    ],
  },
  {
    name: "OXVA Xlim Pro 2",
    slug: "oxva-xlim-pro-2",
    brand: "OXVA",
    category: "POD_SYSTEMS",
    basePriceCents: 5995,
    skuPrefix: "OXLP2",
    imageCount: 2,
    description:
      "A pod system with a proper 0.96\" display, 30W ceiling and a leather-wrapped frame that feels more expensive than it is. Takes the full Xlim pod range, so coils are never hard to find.",
    variants: [
      { flavour: "Gunmetal", stockQty: nextStock(5, 25), weightGrams: 195 },
      { flavour: "Rose Gold", stockQty: nextStock(2, 15), weightGrams: 195 },
    ],
  },
  {
    name: "Geekvape Sonder Q2",
    slug: "geekvape-sonder-q2",
    brand: "Geekvape",
    category: "POD_SYSTEMS",
    basePriceCents: 3495,
    skuPrefix: "GVSQ2",
    imageCount: 2,
    description:
      "A slim, dependable starter pod with 20W output and a 1000mAh battery. Q-series pods are cheap and everywhere. If someone asks for a first device under $40, this is the answer.",
    variants: [
      { flavour: "Black", stockQty: nextStock(10, 40), weightGrams: 142 },
      { flavour: "Slate", stockQty: nextStock(5, 30), weightGrams: 142 },
    ],
  },
  {
    name: "Geekvape Aegis Legend 3",
    slug: "geekvape-aegis-legend-3",
    brand: "Geekvape",
    category: "MODS",
    basePriceCents: 12995,
    featured: true,
    skuPrefix: "GVAL3",
    imageCount: 3,
    description:
      "The tank of the mod world, in its third generation. IP68 rated against water and dust, drop-tested from two metres, 200W from dual 18650s, and Geekvape's A-Lock board for consistent output as cells sag. Batteries sold separately.",
    variants: [
      { flavour: "Black", stockQty: nextStock(3, 15), weightGrams: 312 },
      { flavour: "Gunmetal", stockQty: nextStock(2, 12), weightGrams: 312 },
    ],
  },
  {
    name: "Vaporesso Gen 200 II",
    slug: "vaporesso-gen-200-ii",
    brand: "Vaporesso",
    category: "MODS",
    basePriceCents: 10995,
    skuPrefix: "VG2II",
    imageCount: 2,
    description:
      "A 200W dual-18650 mod with the AXON 2 chipset, pulse mode that fires every 0.02 seconds for flatter power delivery, and the soft-touch coating Vaporesso does better than anyone. Light for its class at 312g without cells.",
    variants: [
      { flavour: "Matte Black", stockQty: nextStock(4, 14), weightGrams: 305 },
      { flavour: "Forest", stockQty: nextStock(1, 10), weightGrams: 305 },
    ],
  },
  {
    name: "VooPoo Drag 5",
    slug: "voopoo-drag-5",
    brand: "VooPoo",
    category: "MODS",
    basePriceCents: 11995,
    skuPrefix: "VPDR5",
    imageCount: 2,
    description:
      "The Drag line's signature leather-and-metal frame with the GENE.FAN 3.0 chip underneath. 200W, superb ramp-up, and a smart mode that caps wattage to whatever coil you install so new users can't torch a fresh coil.",
    variants: [
      { flavour: "Classic Black", stockQty: nextStock(3, 12), weightGrams: 328 },
      { flavour: "Bronze", stockQty: nextStock(0, 8), weightGrams: 328 },
    ],
  },
  {
    name: "Alto Nic Salts 30mL",
    slug: "alto-nic-salts-30ml",
    brand: "Alto",
    category: "E_LIQUIDS",
    basePriceCents: 2995,
    featured: true,
    skuPrefix: "ALTNS",
    imageCount: 2,
    description:
      "Our house salt range, made in an ISO-certified Melbourne lab. Smooth at both strengths, batch-tested, with clean single-note profiles that suit low-wattage pod systems. 50/50 VG/PG.",
    variants: crossVariants(
      ["Cool Mint", "Mango", "Mixed Berry"],
      [25, 50],
      () => nextStock(12, 80),
      95,
    ),
  },
  {
    name: "Southerly Custard & Cream 60mL",
    slug: "southerly-custard-cream-60ml",
    brand: "Southerly",
    category: "E_LIQUIDS",
    basePriceCents: 2795,
    skuPrefix: "STHCC",
    imageCount: 2,
    description:
      "Slow-steeped dessert freebase from Southerly's Sydney facility. The vanilla custard is rich without being buttery; the strawberry cream leans jammy rather than candied. 70/30 VG/PG, best above 40W.",
    variants: crossVariants(
      ["Vanilla Custard", "Strawberry Cream"],
      [0, 3, 6],
      () => nextStock(6, 45),
      165,
    ),
  },
  {
    name: "Ferro Tobacco Series 60mL",
    slug: "ferro-tobacco-series-60ml",
    brand: "Ferro",
    category: "E_LIQUIDS",
    basePriceCents: 2995,
    skuPrefix: "FERTB",
    imageCount: 2,
    description:
      "Tobacco profiles built for ex-smokers: the Classic is dry and leafy with no sweetener at all, the Smooth Caramel adds just enough to round the edges. 60/40 VG/PG works in pods and tanks alike.",
    variants: crossVariants(
      ["Classic", "Smooth Caramel"],
      [3, 6, 12],
      () => nextStock(5, 40),
      165,
    ),
  },
  {
    name: "Alto Fruits 60mL",
    slug: "alto-fruits-60ml",
    brand: "Alto",
    category: "E_LIQUIDS",
    basePriceCents: 2695,
    skuPrefix: "ALTFR",
    imageCount: 2,
    description:
      "The freebase side of the Alto range. Watermelon is crisp with a short cool finish; Grape Ice is dark-fruit forward with a firmer menthol close. 70/30 VG/PG for direct-lung setups.",
    variants: crossVariants(["Watermelon", "Grape Ice"], [0, 3, 6], () => nextStock(8, 50), 165),
  },
  {
    name: "Southerly Menthol 60mL",
    slug: "southerly-menthol-60ml",
    brand: "Southerly",
    category: "E_LIQUIDS",
    basePriceCents: 2795,
    skuPrefix: "STHMN",
    imageCount: 2,
    description:
      "Two takes on cold: Arctic is pure menthol, sharp and clean; Spearmint carries a sweeter garden-mint body under the chill. Both stay crisp at high wattage without turning medicinal.",
    variants: crossVariants(["Arctic", "Spearmint"], [3, 6], () => nextStock(6, 40), 165),
  },
  {
    name: "Ferro Dessert 60mL",
    slug: "ferro-dessert-60ml",
    brand: "Ferro",
    category: "E_LIQUIDS",
    basePriceCents: 3195,
    skuPrefix: "FERDS",
    imageCount: 2,
    description:
      "Ferro's dessert pair steeps for four weeks before bottling. Lemon Tart balances sharp citrus curd against shortcrust; Choc Hazelnut is a dense gianduja without the burnt-sugar aftertaste cheaper liquids hide behind.",
    variants: crossVariants(["Lemon Tart", "Choc Hazelnut"], [0, 3], () => nextStock(4, 30), 165),
  },
  {
    name: "Uwell Caliburn G3 Pods (4 pack)",
    slug: "uwell-caliburn-g3-pods-4pk",
    brand: "Uwell",
    category: "COILS_ACCESSORIES",
    basePriceCents: 2195,
    skuPrefix: "UWG3P",
    imageCount: 2,
    description:
      "Replacement pods for the Caliburn G3 and G3 Mini. The 0.6Ω suits nic salts at 18–22W; the 0.9Ω tightens the draw for a more cigarette-like pull at lower power. Four pods per pack.",
    variants: [
      { flavour: "0.6 ohm", stockQty: nextStock(15, 90), weightGrams: 55 },
      { flavour: "0.9 ohm", stockQty: nextStock(15, 90), weightGrams: 55 },
    ],
  },
  {
    name: "Vaporesso GTX Coils (5 pack)",
    slug: "vaporesso-gtx-coils-5pk",
    brand: "Vaporesso",
    category: "COILS_ACCESSORIES",
    basePriceCents: 2495,
    skuPrefix: "VGTXC",
    imageCount: 2,
    description:
      "GTX mesh coils fit a wide spread of Vaporesso tanks and pods. 0.4Ω for warm direct-lung, 0.8Ω for restricted DL, 1.2Ω for mouth-to-lung with salts. Five per pack, foil-sealed individually.",
    variants: [
      { flavour: "0.4 ohm", stockQty: nextStock(10, 70), weightGrams: 62 },
      { flavour: "0.8 ohm", stockQty: nextStock(10, 70), weightGrams: 62 },
      { flavour: "1.2 ohm", stockQty: nextStock(0, 60), weightGrams: 62 },
    ],
  },
  {
    name: "Geekvape Z Coils (5 pack)",
    slug: "geekvape-z-coils-5pk",
    brand: "Geekvape",
    category: "COILS_ACCESSORIES",
    basePriceCents: 2695,
    skuPrefix: "GVZC",
    imageCount: 2,
    description:
      "Z-series mesh coils for the Zeus tank family. The 0.2Ω runs hot and cloudy at 70–80W; the 0.4Ω is the flavour pick at 50–60W. KA1 mesh with organic cotton, five per pack.",
    variants: [
      { flavour: "0.2 ohm", stockQty: nextStock(8, 60), weightGrams: 68 },
      { flavour: "0.4 ohm", stockQty: nextStock(8, 60), weightGrams: 68 },
    ],
  },
  {
    name: "E7 18650 Battery Twin Pack",
    slug: "e7-18650-battery-twin-pack",
    brand: "Element Seven",
    category: "COILS_ACCESSORIES",
    basePriceCents: 3495,
    skuPrefix: "E7B18",
    imageCount: 2,
    description:
      "Matched pairs of authentic 3,000mAh 15A 18650 cells, rewrapped and batch-tested in-house. Supplied in a hard plastic case — never carry loose cells. Suits all dual-18650 mods we stock.",
    variants: [{ stockQty: nextStock(10, 45), weightGrams: 145 }],
  },
  {
    name: "Cirro Bar 8000 — Bulk Case",
    slug: "cirro-bar-8000-bulk-case",
    brand: "Cirro",
    category: "BULK",
    basePriceCents: 15995,
    featured: true,
    skuPrefix: "CIR8KB",
    imageCount: 2,
    description:
      "Our best-selling 8,000-puff disposable, bought by the case. Mixed best-selling flavours, sealed cartons, priced per unit lower the more you take. Ideal for events, share-houses, or simply not running out.",
    variants: [
      { flavour: "5-pack", priceCents: 14995, stockQty: nextStock(6, 40), weightGrams: 260 },
      { flavour: "10-pack", priceCents: 27995, stockQty: nextStock(4, 30), weightGrams: 510 },
      { flavour: "20-pack", priceCents: 51995, stockQty: nextStock(2, 18), weightGrams: 1010 },
    ],
  },
  {
    name: "Alto Nic Salts — Bulk Case",
    slug: "alto-nic-salts-bulk-case",
    brand: "Alto",
    category: "BULK",
    basePriceCents: 12995,
    skuPrefix: "ALTNSB",
    imageCount: 2,
    description:
      "A mixed case of our house 30mL nic salts across the core flavour range. Same Melbourne-made, batch-tested liquid, packed by the carton at a per-bottle saving. Assorted strengths included.",
    variants: [
      { flavour: "5-pack", priceCents: 12995, stockQty: nextStock(8, 45), weightGrams: 520 },
      { flavour: "10-pack", priceCents: 23995, stockQty: nextStock(5, 30), weightGrams: 1020 },
    ],
  },
  {
    name: "Uwell Caliburn G3 Pods — Bulk",
    slug: "uwell-caliburn-g3-pods-bulk",
    brand: "Uwell",
    category: "BULK",
    basePriceCents: 5995,
    skuPrefix: "UWG3PB",
    imageCount: 2,
    description:
      "Replacement G3 pods bought by the carton — each pack holds four pods, so a 3-pack is a dozen pods. The sensible way to stock up on the consumable you get through fastest.",
    variants: [
      { flavour: "3-pack", priceCents: 5995, stockQty: nextStock(10, 60), weightGrams: 190 },
      { flavour: "6-pack", priceCents: 10995, stockQty: nextStock(6, 40), weightGrams: 370 },
      { flavour: "12-pack", priceCents: 19995, stockQty: nextStock(2, 24), weightGrams: 730 },
    ],
  },
];

const DEFAULT_ZONES = [
  {
    id: "metro",
    name: "Metro",
    ranges: [
      [1000, 2249],
      [2555, 2574],
      [2740, 2786],
      [3000, 3207],
      [3800, 3999],
      [4000, 4207],
      [5000, 5199],
      [6000, 6214],
    ],
    services: [
      {
        id: "standard",
        name: "Standard",
        etaMinDays: 2,
        etaMaxDays: 4,
        brackets: [
          { maxGrams: 500, priceCents: 895 },
          { maxGrams: 3000, priceCents: 1195 },
          { maxGrams: null, priceCents: 1595 },
        ],
      },
      {
        id: "express",
        name: "Express",
        etaMinDays: 1,
        etaMaxDays: 2,
        brackets: [
          { maxGrams: 500, priceCents: 1395 },
          { maxGrams: 3000, priceCents: 1795 },
          { maxGrams: null, priceCents: 2395 },
        ],
      },
    ],
  },
  {
    id: "regional",
    name: "Regional",
    ranges: [
      [2250, 2554],
      [2575, 2739],
      [2787, 2898],
      [3211, 3799],
      [4208, 4699],
      [5200, 5749],
      [6215, 6699],
      [7000, 7499],
    ],
    services: [
      {
        id: "standard",
        name: "Standard",
        etaMinDays: 3,
        etaMaxDays: 7,
        brackets: [
          { maxGrams: 500, priceCents: 1095 },
          { maxGrams: 3000, priceCents: 1495 },
          { maxGrams: null, priceCents: 1995 },
        ],
      },
      {
        id: "express",
        name: "Express",
        etaMinDays: 2,
        etaMaxDays: 4,
        brackets: [
          { maxGrams: 500, priceCents: 1695 },
          { maxGrams: 3000, priceCents: 2195 },
          { maxGrams: null, priceCents: 2895 },
        ],
      },
    ],
  },
  {
    id: "remote",
    name: "Remote",
    ranges: [
      [800, 999],
      [2899, 2999],
      [4700, 4999],
      [5750, 5999],
      [6700, 6999],
      [7500, 7999],
    ],
    services: [
      {
        id: "standard",
        name: "Standard",
        etaMinDays: 5,
        etaMaxDays: 12,
        brackets: [
          { maxGrams: 500, priceCents: 1495 },
          { maxGrams: 3000, priceCents: 2195 },
          { maxGrams: null, priceCents: 2995 },
        ],
      },
    ],
  },
];

async function main() {
  const demoHash = hashSync("e7-customer-dev", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@elementseven.net" },
    update: {},
    create: {
      email: "admin@elementseven.net",
      name: "Store Admin",
      role: "ADMIN",
      passwordHash: hashSync("e7-admin-dev", 12),
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Casey Nguyen",
      role: "CUSTOMER",
      passwordHash: demoHash,
      marketingOptIn: true,
      emailVerified: new Date(),
      addresses: {
        create: {
          label: "Home",
          fullName: "Casey Nguyen",
          line1: "14 Foveaux Street",
          suburb: "Surry Hills",
          state: "NSW",
          postcode: "2010",
          phone: "0412 000 111",
          isDefault: true,
        },
      },
    },
  });

  await prisma.accessRequest.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      status: "APPROVED",
      dateOfBirth: new Date("1992-03-14"),
      smokingStatus: "DAILY",
      cigarettesPerDay: 15,
      yearsSmoked: 9,
      vapedBefore: true,
      quitIntent: true,
      aidsTried: ["Nicotine patches", "Cold turkey"],
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  const extraCustomers = [
    ["mia.walker@example.com", "Mia Walker", true],
    ["jordan.lee@example.com", "Jordan Lee", true],
    ["sam.patel@example.com", "Sam Patel", true],
    ["alex.osei@example.com", "Alex Osei", false],
    ["tessa.kim@example.com", "Tessa Kim", true],
  ] as const;

  for (const [email, name, optIn] of extraCustomers) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash: demoHash,
        marketingOptIn: optIn,
        emailVerified: new Date(),
      },
    });
  }

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        category: p.category,
        description: p.description,
        basePriceCents: p.basePriceCents,
        featured: p.featured ?? false,
        published: true,
        images: {
          create: Array.from({ length: p.imageCount }, (_, i) => ({
            url: `/api/placeholder/${p.category.toLowerCase()}-${p.slug}-${i + 1}`,
            alt: `${p.name} — view ${i + 1}`,
            position: i,
          })),
        },
      },
    });

    for (const [i, v] of p.variants.entries()) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: skuFor(p.skuPrefix, v, i),
          flavour: v.flavour ?? null,
          strengthMg: v.strengthMg ?? null,
          priceCents: v.priceCents ?? null,
          stockQty: v.stockQty,
          weightGrams: v.weightGrams,
        },
      });
      await prisma.stockMovement.create({
        data: {
          variantId: variant.id,
          delta: v.stockQty,
          reason: StockReason.RECEIVED,
          note: "Initial stock intake",
          actorId: admin.id,
        },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: "store" },
    update: {},
    create: {
      key: "store",
      value: {
        storeName: "Element Seven",
        contactEmail: "hello@elementseven.net",
        freeShippingThresholdCents: 7500,
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: "shippingZones" },
    update: {},
    create: { key: "shippingZones", value: DEFAULT_ZONES },
  });

  const hasOrders = await prisma.order.count();
  if (hasOrders === 0) {
    const xros = await prisma.productVariant.findFirst({
      where: { sku: "VXR4-BLA-01" },
      include: { product: true },
    });
    const salts = await prisma.productVariant.findFirst({
      where: { sku: "ALTNS-COOMIN-25" },
      include: { product: true },
    });
    const coils = await prisma.productVariant.findFirst({
      where: { sku: "VGTXC-08OHM-02" },
      include: { product: true },
    });

    const demoOrders: Array<{
      number: string;
      status: OrderStatus;
      daysAgo: number;
      items: Array<{ v: typeof xros; qty: number }>;
      tracking?: { number: string; carrier: string };
    }> = [
      {
        number: "E7-DEMO-1001",
        status: "DELIVERED",
        daysAgo: 21,
        items: [
          { v: xros, qty: 1 },
          { v: salts, qty: 2 },
        ],
        tracking: { number: "33AUD9012345", carrier: "auspost" },
      },
      {
        number: "E7-DEMO-1002",
        status: "SHIPPED",
        daysAgo: 3,
        items: [{ v: salts, qty: 3 }],
        tracking: { number: "33AUD9054321", carrier: "auspost" },
      },
      {
        number: "E7-DEMO-1003",
        status: "PROCESSING",
        daysAgo: 1,
        items: [{ v: coils, qty: 2 }],
      },
      {
        number: "E7-DEMO-1004",
        status: "PAID",
        daysAgo: 0,
        items: [
          { v: coils, qty: 1 },
          { v: salts, qty: 1 },
        ],
      },
    ];

    for (const o of demoOrders) {
      const lines = o.items.filter((i) => i.v != null);
      if (lines.length === 0) continue;
      const subtotal = lines.reduce(
        (sum, l) => sum + (l.v!.priceCents ?? l.v!.product.basePriceCents) * l.qty,
        0,
      );
      const shipping = subtotal >= 7500 ? 0 : 895;
      const placed = new Date(Date.now() - o.daysAgo * 86400000);
      const step = 8 * 3600000;

      await prisma.order.create({
        data: {
          number: o.number,
          userId: customer.id,
          email: customer.email,
          status: o.status,
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: subtotal + shipping,
          shippingMethod: "Standard",
          shipName: "Casey Nguyen",
          shipLine1: "14 Foveaux Street",
          shipSuburb: "Surry Hills",
          shipState: "NSW",
          shipPostcode: "2010",
          shipPhone: "0412 000 111",
          trackingNumber: o.tracking?.number ?? null,
          carrier: o.tracking?.carrier ?? null,
          createdAt: placed,
          paidAt: placed,
          processingAt: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status)
            ? new Date(placed.getTime() + step)
            : null,
          shippedAt: ["SHIPPED", "DELIVERED"].includes(o.status)
            ? new Date(placed.getTime() + 2 * step)
            : null,
          deliveredAt: o.status === "DELIVERED" ? new Date(placed.getTime() + 8 * step) : null,
          stripePaymentIntentId: `pi_demo_${o.number.toLowerCase()}`,
          items: {
            create: lines.map((l) => ({
              variantId: l.v!.id,
              productSlug: l.v!.product.slug,
              name: l.v!.product.name,
              variantLabel: [l.v!.flavour, l.v!.strengthMg != null ? `${l.v!.strengthMg}mg` : null]
                .filter(Boolean)
                .join(" · "),
              sku: l.v!.sku,
              unitPriceCents: l.v!.priceCents ?? l.v!.product.basePriceCents,
              quantity: l.qty,
            })),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin:    admin@elementseven.net / e7-admin-dev");
  console.log("Customer: customer@example.com / e7-customer-dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
