/**
 * src/components/onboarding/shared.ts
 * Shared types and helpers for the onboarding sub-forms.
 *
 * Each sub-form (HomeownerForm, HandymanForm, BusinessForm, ArchitectForm)
 * collects its sector-specific fields and persists them into the central
 * Chameleon Ecosystem Ledger via `updateEcosystemLedger`, then opens a
 * preview demo session and routes the user to the shared `/dashboard` view.
 */
import { getEcosystemLedger, updateEcosystemLedger, type UserSector } from "@/core/demo-session";

export type OnboardingProfileBase = {
  id: string;
  sector: UserSector | "architect";
  createdAt: string;
};

/**
 * Merge a freshly-submitted profile into the ledger under `ledger.profiles[sector]`.
 * Returns the new profile id for routing / receipts.
 */
export function persistOnboardingProfile<T extends Record<string, unknown>>(
  sector: UserSector | "architect",
  data: T,
): string {
  const ledger = getEcosystemLedger();
  const id = `${sector.toUpperCase()}-${Date.now()}`;
  const profile: OnboardingProfileBase & T = {
    id,
    sector,
    createdAt: new Date().toISOString(),
    ...data,
  };
  if (!ledger.profiles) ledger.profiles = {};
  if (!ledger.profiles[sector]) ledger.profiles[sector] = [];
  ledger.profiles[sector].push(profile);
  updateEcosystemLedger(ledger);
  return id;
}
