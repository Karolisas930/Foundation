import { createFileRoute } from "@tanstack/react-router";
import { useDashboard } from "@/routes/_dashboard/route";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export const Route = createFileRoute("/_dashboard/homeowner/")({
  component: HomeownerDashboardPage,
});

function HomeownerDashboardPage() {
  const { displayName } = useDashboard();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-slate-300">
          This is your homeowner dashboard. Here you can manage your projects and view your matches.
        </p>
        {/* Other homeowner dashboard components would go here */}
      </div>
    </DashboardLayout>
  );
}