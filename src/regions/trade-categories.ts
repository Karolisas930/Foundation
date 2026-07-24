/**
 * Trade-specific sub-category definitions.
 *
 * TRADE_CATEGORIES is keyed by a short internal key (TradeKey). The
 * profile / onboarding UI stores `trade` as the long label coming from
 * TRADE_OPTIONS in `country-data.ts`, so use `resolveTradeKey(trade)` to
 * map from that label to a TradeKey before reading TRADE_CATEGORIES.
 */
export const TRADE_CATEGORIES = {
  electrical: {
    label: "Electrical Systems",
    icon: "Zap",
    subCategories: ["Smart Home", "EV Charging", "Lighting", "Wiring"],
  },
  plumbing: {
    label: "Plumbing & Heating",
    icon: "Droplet",
    subCategories: ["HVAC", "Water Installation", "Gas Systems"],
  },
  solar: {
    label: "Solar & Renewable",
    icon: "Sun",
    subCategories: ["Photovoltaic", "Battery Storage", "Heat Pumps"],
  },
  roofing: {
    label: "Roofing & Waterproofing",
    icon: "Home",
    subCategories: ["Flat Roofs", "Pitched Roofs", "Gutters", "Waterproofing"],
  },
  carpentry: {
    label: "Carpentry & Joinery",
    icon: "Hammer",
    subCategories: ["Timber Framing", "Custom Cabinetry", "Doors", "Fit-Out"],
  },
  painting: {
    label: "Painting & Decorating",
    icon: "Paintbrush",
    subCategories: ["Interior", "Facades", "Wallpaper", "Decorative Finishes"],
  },
  tiling: {
    label: "Tiling & Stone",
    icon: "Grid3x3",
    subCategories: ["Bathrooms", "Kitchens", "Natural Stone", "Mosaics"],
  },
} as const;

export type TradeKey = keyof typeof TRADE_CATEGORIES;

/**
 * Maps the long label used in TRADE_OPTIONS (country-data.ts) to a
 * TradeKey. Returns null when no sub-categories are defined for that trade.
 */
const TRADE_KEY_BY_LABEL: Record<string, TradeKey> = {
  "Electrical Systems & Smart Home": "electrical",
  "Smart Home & Building Automation": "electrical",
  "EV Charging Station & Heat Pump Installation": "electrical",
  "Plumbing, Heating & HVAC": "plumbing",
  "Gas & Water Installation": "plumbing",
  "Refrigeration, Air Conditioning & Cooling Systems": "plumbing",
  "Solar & Photovoltaic (PV) Installation": "solar",
  "Roofing & Waterproofing": "roofing",
  "Carpentry & Timber Framing": "carpentry",
  "Joinery, Custom Cabinetry & Doors": "carpentry",
  "Painting, Decorating & Facades": "painting",
  "Tiling, Mosaics & Natural Stone": "tiling",
};

export function resolveTradeKey(trade: string | null | undefined): TradeKey | null {
  if (!trade) return null;
  return TRADE_KEY_BY_LABEL[trade] ?? null;
}
