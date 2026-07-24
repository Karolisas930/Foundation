import { createFileRoute } from "@tanstack/react-router";
import { ProfileAppPage } from "@/features/contractor/profile/components/ProfileAppPage";

export const Route = createFileRoute("/_dashboard/contractor/performance")({
  head: () => ({
    meta: [{ title: "Performance — HANDWERK" }],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  return <ProfileAppPage initialPage="performance" />;
}
