/**
 * ============================================================================
 *  PROTECTED CORE FILE — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
 * ----------------------------------------------------------------------------
 *  This file is part of the Chameleon / Dynamic Sector core and the project's
 *  shared theming surface. Edits here cascade across every sector, route, and
 *  visual primitive. Refactors, renames, "cleanups", or stylistic rewrites
 *  are NOT permitted unless the user has specifically requested a change to
 *  this file by name.
 *
 *  Allowed: additive, backwards-compatible fixes the user explicitly asked for.
 *  Forbidden: silent reorganization, removing exports, changing public API,
 *  swapping tokens, or "modernizing" patterns.
 * ============================================================================
 */
/**
 * Central in-memory "Chameleon Ecosystem Ledger".
 *
 * Seeded with Baden-Württemberg construction jobs. Components subscribe
 * to the `chameleon_ledger_update` window event to re-render on changes.
 *
 * In production this would be wired to Lovable Cloud / DB.
 */
export type UserSector = "homeowner" | "handyman" | "business" | "admin";

export type EcosystemProject = {
  id: string;
  seekerId?: string;
  title: string;
  description: string;
  locationZip: string;
  city?: string;
  phase?: "Planung" | "Rohbau" | "Ausbau" | "Übergabe";
  status: "open" | "clarifying" | "awarded" | "completed";
  budgetTotal: number;
  budgetUsed: number;
  trade?: string;
  mediaUrls?: string[];
  voiceTranscript?: string;
  desiredStart?: string;
  flexibilityDays?: number;
  /** Human-readable language list (e.g. "🇬🇧 English · 🇩🇪 Deutsch · 🌐 Tagalog"). */
  language?: string;
};

export type EcosystemMessage = {
  id: string;
  projectId: string;
  senderRole: "handyman" | "homeowner" | "business";
  text: string;
  timestamp: string;
};

export type EcosystemOrder = {
  id: string;
  projectId: string;
  lane: "disposal" | "logistics";
  item: string;
  placedAt: string;
};

export type EcosystemProposal = {
  id: string;
  projectId: string;
  company: string;
  city?: string;
  rating: number;
  labor: number;
  materials: number;
  travel: number;
  postedAt?: string;
  /**
   * Stable public profile ID for the bidding contractor. Used to link the
   * proposal card directly to `/p/$profileId`. Optional for legacy rows.
   */
  profileId?: string;
};

/** Demo public profile UUIDs so seeded bids can link to `/p/$profileId`. */
export const DEMO_CONTRACTOR_PROFILE_IDS = {
  mueller: "11111111-1111-4111-8111-111111111111",
  aras: "22222222-2222-4222-8222-222222222222",
} as const;

export type EcosystemLedger = {
  projects: EcosystemProject[];
  messages: EcosystemMessage[];
  orders: EcosystemOrder[];
  proposals: EcosystemProposal[];
  profiles: Record<string, Array<Record<string, unknown> & { id: string }>>;
  session: { sector: UserSector | null; startedAt: string | null };
};

const LEDGER_KEY = "chameleon_ledger_v2";
const UPDATE_EVENT = "chameleon_ledger_update";

function seedLedger(): EcosystemLedger {
  const now = new Date().toISOString();
  return {
    session: { sector: null, startedAt: null },
    profiles: {},
    orders: [],
    proposals: [],
    messages: [],
    projects: [],
  } as EcosystemLedger;
}

const _noop_now = () => new Date().toISOString();

let cache: EcosystemLedger | null = null;

function readStore(): EcosystemLedger {
  if (typeof window === "undefined") {
    if (!cache) cache = seedLedger();
    return cache;
  }
  try {
    const raw = window.sessionStorage.getItem(LEDGER_KEY);
    if (raw) return JSON.parse(raw) as EcosystemLedger;
  } catch {
    /* ignore */
  }
  const seeded = seedLedger();
  try {
    window.sessionStorage.setItem(LEDGER_KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

export function getEcosystemLedger(): EcosystemLedger {
  return readStore();
}

export function updateEcosystemLedger(next: EcosystemLedger): void {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function startDemoSession(sector: UserSector): void {
  const ledger = getEcosystemLedger();
  ledger.session = { sector, startedAt: new Date().toISOString() };
  updateEcosystemLedger(ledger);
}

/** Reset the ledger to seed values — useful for dev tooling. */
export function resetEcosystemLedger(): void {
  cache = seedLedger();
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(LEDGER_KEY, JSON.stringify(cache));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }
}
