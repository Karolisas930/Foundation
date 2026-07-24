import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/features/shared/dashboard/components/DashboardShell";
import { stampAccountTypeIfMissing } from "@/lib/account-type";

export const Route = createFileRoute("/_dashboard/homeowner/")({
  head: () => ({
    meta: [
      { title: "Client Dashboard — HANDWERK" },
      {
        name: "description",
        content: "Track incoming bids and manage your posted projects.",
      },
    ],
  }),
  component: HomeownerDashboardPage,
});

function HomeownerDashboardPage() {
  // First-load stamp: covers the magic-link and Google/Apple OAuth returns
  // that land here after `?sector=homeowner` redirects. Idempotent — only
  // writes when `profiles.account_type` is still null, so it never clobbers
  // an existing role. Password-based signup still stamps eagerly inside
  // SuccessScreen, this is the shared safety net for the three redirecting
  // flows that don't run that code path.
  useEffect(() => {
    void stampAccountTypeIfMissing("homeowner");
  }, []);

  return <DashboardShell sector="homeowner" />;
}
