import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { StaffLocationsPage } from "@/features/contractor/team/components/StaffLocationsPage";
import { hasPremiumAccess } from "@/config/billing.config";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { Button } from "@/components/ui/button";

function StaffLocationsGate() {
  // When IS_MONETIZATION_ENABLED is false, hasPremiumAccess() returns true
  // and the full page renders. When true, only trial/active subs get through.
  if (hasPremiumAccess()) return <StaffLocationsPage />;

  return (
    <div className="relative min-h-screen bg-navy-ink text-slate-50">
      <TopBar showMenu />
      <div className="mx-auto max-w-lg px-4 py-16 pb-24 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange/15 text-orange">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Team GPS Locations — Premium</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live staff location tracking is part of the Pro plan. Start your free trial or upgrade
          your subscription to enable consent-based GPS sharing across your crew.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/settings">
            <Button type="button">Manage subscription</Button>
          </Link>
        </div>
      </div>
      <BottomBar />
    </div>
  );
}

export const Route = createFileRoute("/_dashboard/contractor/team/locations")({
  head: () => ({
    meta: [
      { title: "Staff Locations — Handwerk BW" },
      {
        name: "description",
        content:
          "Consent-first location sharing for team members. See where dispatched staff are, when they've opted in.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <StaffLocationsGate />,
});
