/**
 * Lead dispatch layer.
 *
 * Bridges the demo ecosystem ledger + active handyman profile into the
 * pure Matching Filter Engine. Called by route loaders and workspace
 * components so lead classification (score + hard filters) happens at
 * one canonical seam.
 *
 * Isomorphic-safe: the ledger lives in localStorage, so we defensively
 * return empty results during SSR / prerender.
 */
import { getEcosystemLedger, type EcosystemProject } from "@/core/demo-session";
import {
  getActiveHandymanProfile,
  type HandymanProfile,
} from "@/features/contractor/profile/profile-gate";
import {
  partitionLeads,
  type MatchableLead,
  type PartitionedLeads,
  type LeadClassification,
  type MatchingProfile,
} from "@/features/shared/matches/matching-engine";

export interface DispatchableLead extends MatchableLead {
  project: EcosystemProject;
}

export interface LeadDispatchResult extends PartitionedLeads<DispatchableLead> {
  hasProfile: boolean;
  profile: HandymanProfile | null;
}

const OPEN_STATUSES: ReadonlyArray<EcosystemProject["status"]> = ["open", "clarifying"];

function loadOpenLeads(): DispatchableLead[] {
  if (typeof window === "undefined") return [];
  try {
    const ledger = getEcosystemLedger();
    return ledger.projects
      .filter((p) => OPEN_STATUSES.includes(p.status))
      .map((p) => ({
        id: p.id,
        estimatedBudget: p.budgetTotal,
        trade: p.trade ?? null,
        locationZip: p.locationZip ?? null,
        language: p.language ?? null,
        project: p,
      }));
  } catch {
    return [];
  }
}

function loadProfile(): HandymanProfile | null {
  if (typeof window === "undefined") return null;
  try {
    return getActiveHandymanProfile();
  } catch {
    return null;
  }
}

function toMatchingProfile(p: HandymanProfile | null): MatchingProfile {
  return {
    minProjectSize: p?.minProjectSize ?? null,
    serviceRadiusKm: p?.radiusKm ?? null,
    postalCode: p?.postalCode ?? null,
    trades: p?.trades ?? null,
    languages: p?.languages ?? null,
  };
}

/** Route-dispatch entry point. Safe to call from a TanStack loader. */
export function dispatchLeadsForCurrentUser(): LeadDispatchResult {
  const profile = loadProfile();
  const leads = loadOpenLeads();
  const partition = partitionLeads(leads, toMatchingProfile(profile));
  return { ...partition, hasProfile: profile !== null, profile };
}

/** Passive count for the /notifications badge. */
export function getSilentAlertsCount(): number {
  return dispatchLeadsForCurrentUser().alerts.length;
}

export type { LeadClassification };
