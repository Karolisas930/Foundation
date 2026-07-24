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

const LEDGER_KEY = "chameleon_ledger";
const UPDATE_EVENT = "chameleon_ledger_update";

function seedLedger(): EcosystemLedger {
  const now = new Date().toISOString();
  return {
    session: { sector: null, startedAt: null },
    profiles: {},
    orders: [],
    proposals: [
      {
        id: "BID-9001",
        projectId: "PROJ-702",
        company: "Müller Trockenbau GmbH",
        city: "Mannheim",
        rating: 4.9,
        labor: 2400,
        materials: 1100,
        travel: 100,
        postedAt: "today · 09:42",
        profileId: DEMO_CONTRACTOR_PROFILE_IDS.mueller,
      },
      {
        id: "BID-9002",
        projectId: "PROJ-702",
        company: "Aras Statyba",
        city: "Ludwigshafen",
        rating: 4.6,
        labor: 2100,
        materials: 1300,
        travel: 150,
        postedAt: "today · 10:10",
        profileId: DEMO_CONTRACTOR_PROFILE_IDS.aras,
      },
    ],
    messages: [
      {
        id: "MSG-1001",
        projectId: "PROJ-701",
        senderRole: "handyman",
        text: "Is scaffolding already on site or do I need to source it?",
        timestamp: "today · 09:14",
      },
      {
        id: "MSG-1002",
        projectId: "PROJ-702",
        senderRole: "handyman",
        text: "Confirming the tile area is ~12 m². Could you send a photo of the substrate?",
        timestamp: "today · 08:02",
      },
    ],
    projects: [
      {
        id: "PROJ-701",
        title: "Replace garden wall & pour new foundation",
        description:
          "Demo and replace 14m garden wall, new strip foundation, reuse existing clinker. Mannheim Lindenhof.",
        locationZip: "68159",
        city: "Mannheim",
        phase: "Planung",
        status: "open",
        budgetTotal: 8500,
        budgetUsed: 0,
        trade: "Bricklaying & Concrete",
      },
      {
        id: "PROJ-702",
        title: "Bathroom retile · 12 m²",
        description:
          "Strip existing tiles, level substrate, full retile with large-format porcelain. Heidelberg Bergheim.",
        locationZip: "69115",
        city: "Heidelberg",
        phase: "Ausbau",
        status: "clarifying",
        budgetTotal: 4200,
        budgetUsed: 0,
        trade: "Tiling & Mosaics",
      },
      {
        id: "PROJ-703",
        title: "Flat-roof insulation upgrade",
        description:
          "Add 160mm PIR insulation over existing flat roof, new bitumen membrane. Karlsruhe Oststadt.",
        locationZip: "76131",
        city: "Karlsruhe",
        phase: "Planung",
        status: "open",
        budgetTotal: 12500,
        budgetUsed: 0,
        trade: "Roofing & Insulation",
      },
      {
        id: "PROJ-704",
        title: "Single-family home rewire",
        description:
          "Full rewire 1960s detached, new RCD distribution, smart-home prep. Stuttgart Bad Cannstatt.",
        locationZip: "70372",
        city: "Stuttgart",
        phase: "Ausbau",
        status: "awarded",
        budgetTotal: 18900,
        budgetUsed: 2400,
        trade: "Electrical Engineering",
      },
      {
        id: "PROJ-705",
        title: "Loft conversion · carpentry",
        description: "New roof dormers, timber stair, insulation between rafters. Freiburg Wiehre.",
        locationZip: "79100",
        city: "Freiburg",
        phase: "Rohbau",
        status: "open",
        budgetTotal: 26000,
        budgetUsed: 0,
        trade: "Carpentry & Timber",
      },
    ],
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
