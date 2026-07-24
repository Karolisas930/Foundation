import { createFileRoute } from "@tanstack/react-router";
import { dispatchLeadsForCurrentUser } from "@/features/contractor/leads/lead-dispatch";
import { NotificationsList } from "@/features/shared/notifications/NotificationsList";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";

export const Route = createFileRoute("/_dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HANDWERK" }] }),
  loader: () => {
    const { alerts, priority, appliedThreshold, hasProfile } = dispatchLeadsForCurrentUser();
    return {
      alertCount: alerts.length,
      priorityCount: priority.length,
      appliedThreshold,
      hasProfile,
    };
  },
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <NotificationsList />
      </main>
      <BottomBar />
    </div>
  );
}
