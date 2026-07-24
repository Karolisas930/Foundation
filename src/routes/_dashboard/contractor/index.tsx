import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/features/shared/dashboard/components/DashboardShell";
import { dispatchLeadsForCurrentUser } from "@/features/contractor/leads/lead-dispatch";
import { usePriorityLeadNotifications } from "@/features/shared/notifications/hooks/usePriorityLeadNotifications";

export const Route = createFileRoute("/_dashboard/contractor/")({
  head: () => ({
    meta: [
      { title: "Contractor Dashboard — HANDWERK" },
      {
        name: "description",
        content: "Priority leads, active jobs, and quotes for verified trades.",
      },
    ],
  }),
  // Route dispatch layer: classify leads before render so only priority
  // matches surface in the workspace. Sub-threshold leads are silently
  // partitioned into the Alerts feed — no push, no badge burst.
  loader: () => {
    const { priority, alerts, appliedThreshold, hasProfile } = dispatchLeadsForCurrentUser();
    return {
      priorityCount: priority.length,
      silentAlertCount: alerts.length,
      appliedThreshold,
      hasProfile,
    };
  },
  component: ContractorDashboardPage,
});

function ContractorDashboardPage() {
  // Contractor bucket renders with a non-homeowner sector; DashboardShell
  // falls back to a sensible contractor default when sector isn't provided
  // via search params (kept lightweight — trade-specific chameleon views
  // still switch via TestingSwitchboard for dev).
  // Phase 3: mirror locally-classified priority leads into the
  // notifications table so the bell + realtime counter light up.
  usePriorityLeadNotifications();
  return <DashboardShell sector="handyman" />;
}
