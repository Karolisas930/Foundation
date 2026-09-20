/**
 * /homeowner — the single homeowner dashboard route.
 *
 * Duplicate-dashboard cleanup: this route used to carry its own inline,
 * cut-down copy of the homeowner dashboard (projects list + details +
 * chat only) while the full implementation
 * (`src/features/homeowner/dashboard/components/HomeownerDashboard.tsx`)
 * was only reachable through the Chameleon sector registry. Two surfaces
 * claimed to be "the homeowner dashboard" and drifted apart.
 *
 * The route now renders the same DashboardShell/Chameleon pipeline the
 * contractor route uses, so `HomeownerDashboard` is the one and only
 * homeowner surface.
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/features/shared/dashboard/components/DashboardShell";

export const Route = createFileRoute("/_dashboard/homeowner/")({
  head: () => ({
    meta: [
      { title: "Your project dashboard — HANDWERK" },
      {
        name: "description",
        content:
          "Live project status, incoming bids and scheduled site visits for your home projects.",
      },
      { property: "og:title", content: "Your project dashboard — HANDWERK" },
      {
        property: "og:description",
        content:
          "Live project status, incoming bids and scheduled site visits for your home projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeownerDashboardPage,
});

function HomeownerDashboardPage() {
  return <DashboardShell sector="homeowner" />;
}
