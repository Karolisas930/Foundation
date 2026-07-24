/**
 * Phase 6 — Trade-Specialty data structures (local-only, pre-cloud).
 *
 * Drizzle-ORM is not yet installed in this project, so this module ships
 * framework-agnostic TypeScript definitions that mirror the shape a
 * future Drizzle `pgTable` schema will take. When Drizzle is wired in,
 * each `*Table` object below can be swapped for `pgTable(...)` without
 * touching the exported row/insert types the rest of the app imports.
 *
 * Covers the 5 specialties named in
 * docs/blueprint/PRODUCT_BLUEPRINT.md → Phase 6:
 *   1. Electrical / Smart Home
 *   2. Plumbing / HVAC
 *   3. Solar / PV
 *   4. Gas & Water
 *   5. EV Charging + Heat Pumps
 *
 * Kept intentionally additive — a 6th specialty is a new entry in
 * `TRADE_SPECIALTIES`, no schema surgery required.
 */

// ---------------------------------------------------------------------------
// Specialty registry
// ---------------------------------------------------------------------------

export type TradeSpecialtyId =
  | "electrical_smart_home"
  | "plumbing_hvac"
  | "solar_pv"
  | "gas_water"
  | "ev_heatpump";

export interface TradeSpecialtyDef {
  id: TradeSpecialtyId;
  slug: string; // used by /trades/$specialty
  label: string;
  /** Certifications typically required to legally offer this trade in DE. */
  requiredCertifications: readonly string[];
  /** Optional feature flags for the dynamic route to gate sections. */
  features: {
    permits: boolean;
    inspection: boolean;
    subsidyPrograms: boolean;
  };
}

export const TRADE_SPECIALTIES: Readonly<Record<TradeSpecialtyId, TradeSpecialtyDef>> = {
  electrical_smart_home: {
    id: "electrical_smart_home",
    slug: "electrical-smart-home",
    label: "Electrical & Smart Home",
    requiredCertifications: ["Elektrofachkraft", "VDE 0100"],
    features: { permits: true, inspection: true, subsidyPrograms: false },
  },
  plumbing_hvac: {
    id: "plumbing_hvac",
    slug: "plumbing-hvac",
    label: "Plumbing & HVAC",
    requiredCertifications: ["SHK-Meister"],
    features: { permits: false, inspection: true, subsidyPrograms: false },
  },
  solar_pv: {
    id: "solar_pv",
    slug: "solar-pv",
    label: "Solar / PV",
    requiredCertifications: ["Elektrofachkraft PV", "DGS-Fachkraft"],
    features: { permits: true, inspection: true, subsidyPrograms: true },
  },
  gas_water: {
    id: "gas_water",
    slug: "gas-water",
    label: "Gas & Water",
    requiredCertifications: ["TRGI G 600", "DVGW W 1000"],
    features: { permits: true, inspection: true, subsidyPrograms: false },
  },
  ev_heatpump: {
    id: "ev_heatpump",
    slug: "ev-charging-heat-pumps",
    label: "EV Charging & Heat Pumps",
    requiredCertifications: ["Wärmepumpen-Fachbetrieb", "Ladeinfrastruktur §14a EnWG"],
    features: { permits: true, inspection: true, subsidyPrograms: true },
  },
} as const;

export const TRADE_SPECIALTY_IDS = Object.keys(TRADE_SPECIALTIES) as readonly TradeSpecialtyId[];

export function getTradeSpecialtyBySlug(slug: string): TradeSpecialtyDef | undefined {
  return Object.values(TRADE_SPECIALTIES).find((s) => s.slug === slug);
}

// ---------------------------------------------------------------------------
// Row / Insert types — mirror the future Drizzle pgTable columns.
// ---------------------------------------------------------------------------

/** `contractor_trade_specialties` — which specialties a contractor offers. */
export interface ContractorTradeSpecialtyRow {
  id: string; // uuid pk
  contractor_id: string; // fk -> profiles.id
  specialty: TradeSpecialtyId;
  years_experience: number; // int, >= 0
  is_primary: boolean;
  created_at: string; // timestamptz iso
}
export type ContractorTradeSpecialtyInsert = Omit<
  ContractorTradeSpecialtyRow,
  "id" | "created_at"
> & { id?: string; created_at?: string };

/**
 * `trade_specialty_certifications` — one row per uploaded cert proving a
 * contractor holds one of `TradeSpecialtyDef.requiredCertifications`.
 */
export interface TradeSpecialtyCertificationRow {
  id: string;
  contractor_id: string;
  specialty: TradeSpecialtyId;
  certification_key: string; // one of def.requiredCertifications
  issuer: string | null;
  issued_at: string | null; // date iso
  expires_at: string | null; // date iso, null = no expiry
  document_url: string | null; // local echo / storage URL
  verified: boolean;
  created_at: string;
}
export type TradeSpecialtyCertificationInsert = Omit<
  TradeSpecialtyCertificationRow,
  "id" | "created_at" | "verified"
> & { id?: string; created_at?: string; verified?: boolean };

/**
 * `trade_specialty_service_items` — priceable line items scoped to a
 * specialty (e.g. "PV panel install per kWp", "Wallbox 11kW install").
 */
export interface TradeSpecialtyServiceItemRow {
  id: string;
  contractor_id: string;
  specialty: TradeSpecialtyId;
  code: string; // short SKU-like key
  label: string;
  unit: "hour" | "day" | "piece" | "m" | "m2" | "kwp" | "kw";
  unit_price_cents: number; // int, EUR cents
  vat_rate: number; // 0 | 7 | 19
  active: boolean;
  created_at: string;
}
export type TradeSpecialtyServiceItemInsert = Omit<
  TradeSpecialtyServiceItemRow,
  "id" | "created_at" | "active"
> & { id?: string; created_at?: string; active?: boolean };

// ---------------------------------------------------------------------------
// Table descriptors — a thin, Drizzle-shaped registry so app code can
// reference `contractorTradeSpecialties.name` today and be swapped for
// `pgTable(...)` later with zero call-site churn.
// ---------------------------------------------------------------------------

interface IndexDescriptor<TColumns extends string> {
  name: string;
  columns: readonly TColumns[];
  unique?: boolean;
}

interface TableDescriptor<TName extends string, TColumns extends string> {
  name: TName;
  columns: Readonly<Record<TColumns, TColumns>>;
  indexes: readonly IndexDescriptor<TColumns>[];
}

function describe<TName extends string, TColumns extends string>(
  name: TName,
  columns: readonly TColumns[],
  indexes: readonly IndexDescriptor<TColumns>[] = [],
): TableDescriptor<TName, TColumns> {
  const map = Object.fromEntries(columns.map((c) => [c, c])) as Record<TColumns, TColumns>;
  return { name, columns: map, indexes };
}

export const contractorTradeSpecialties = describe(
  "contractor_trade_specialties",
  ["id", "contractor_id", "specialty", "years_experience", "is_primary", "created_at"] as const,
  [
    { name: "idx_cts_contractor_id", columns: ["contractor_id"] },
    { name: "idx_cts_specialty", columns: ["specialty"] },
    {
      name: "uniq_cts_contractor_specialty",
      columns: ["contractor_id", "specialty"],
      unique: true,
    },
  ],
);

export const tradeSpecialtyCertifications = describe(
  "trade_specialty_certifications",
  [
    "id",
    "contractor_id",
    "specialty",
    "certification_key",
    "issuer",
    "issued_at",
    "expires_at",
    "document_url",
    "verified",
    "created_at",
  ] as const,
  [
    { name: "idx_tsc_contractor_id", columns: ["contractor_id"] },
    { name: "idx_tsc_specialty", columns: ["specialty"] },
    { name: "idx_tsc_certification_key", columns: ["certification_key"] },
    { name: "idx_tsc_expires_at", columns: ["expires_at"] },
  ],
);

export const tradeSpecialtyServiceItems = describe(
  "trade_specialty_service_items",
  [
    "id",
    "contractor_id",
    "specialty",
    "code",
    "label",
    "unit",
    "unit_price_cents",
    "vat_rate",
    "active",
    "created_at",
  ] as const,
  [
    { name: "idx_tssi_contractor_id", columns: ["contractor_id"] },
    { name: "idx_tssi_specialty", columns: ["specialty"] },
    { name: "idx_tssi_active", columns: ["active"] },
    { name: "uniq_tssi_contractor_code", columns: ["contractor_id", "code"], unique: true },
  ],
);

// ---------------------------------------------------------------------------
// Subscriptions — master monetization table.
// Gated at runtime by src/config/billing.config.ts → IS_MONETIZATION_ENABLED.
// ---------------------------------------------------------------------------

export type SubscriptionTierLevel = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface SubscriptionRow {
  id: string; // uuid pk
  user_id: string; // fk -> auth.users.id / profiles.id
  tier_level: SubscriptionTierLevel;
  status: SubscriptionStatus;
  trial_ends_at: string | null; // timestamptz iso, null once trial resolved
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
export type SubscriptionInsert = Omit<SubscriptionRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export const subscriptions = describe(
  "subscriptions",
  [
    "id",
    "user_id",
    "tier_level",
    "status",
    "trial_ends_at",
    "current_period_end",
    "created_at",
    "updated_at",
  ] as const,
  [
    { name: "idx_subscriptions_user_id", columns: ["user_id"] },
    { name: "idx_subscriptions_status", columns: ["status"] },
    { name: "uniq_subscriptions_user_id", columns: ["user_id"], unique: true },
  ],
);

export const phase6Schema = {
  contractorTradeSpecialties,
  tradeSpecialtyCertifications,
  tradeSpecialtyServiceItems,
} as const;

export const billingSchema = {
  subscriptions,
} as const;
