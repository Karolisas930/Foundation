/**
 * OnboardingPage — thin dispatcher.
 *
 * The 900-line monolith was refactored into focused sub-components under
 * `src/components/onboarding/`. This file now only routes the requested
 * sector to its dedicated form. Each form saves its profile through
 * `updateEcosystemLedger` and routes to the shared `/dashboard` view.
 */
import type { UserSector } from "@/core/demo-session";
import { HomeownerForm } from "@/features/homeowner/jobs/post-project";
import { OnboardingWizard as HandymanForm } from "@/features/contractor/onboarding/components/OnboardingWizard";
import { BusinessForm } from "@/features/contractor/onboarding/components/BusinessForm";
import { ArchitectForm } from "@/features/contractor/onboarding/components/ArchitectForm";

export type OnboardingSector = UserSector | "architect";

export function OnboardingPage({ sector }: { sector: OnboardingSector }) {
  switch (sector) {
    case "homeowner":
      return <HomeownerForm />;
    case "handyman":
      return <HandymanForm />;
    case "business":
      return <BusinessForm />;
    case "architect":
      return <ArchitectForm />;
    default:
      return <HomeownerForm />;
  }
}

export default OnboardingPage;
