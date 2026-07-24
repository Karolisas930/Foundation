/**
 * /onboarding/profile?sector=<sector> — replacement for the old
 * /onboarding/$sector path segment. Sector now travels as a search param
 * so the URL structure is flat and one route file handles every variant.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { OnboardingPage, type OnboardingSector } from "@/components/shared/OnboardingPage";

const VALID: OnboardingSector[] = ["homeowner", "handyman", "business", "architect"];

type OnboardingSearch = { sector?: OnboardingSector };

export const Route = createFileRoute("/onboarding/profile")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => {
    const s = search.sector;
    if (typeof s === "string" && (VALID as string[]).includes(s)) {
      return { sector: s as OnboardingSector };
    }
    return {};
  },
  head: () => ({
    meta: [{ title: "Onboarding — HANDWERK" }],
  }),
  component: OnboardingProfileRoute,
});

function OnboardingProfileRoute() {
  const { sector } = Route.useSearch();
  if (!sector) {
    return <Navigate to="/onboarding" replace />;
  }
  return <OnboardingPage sector={sector} />;
}
