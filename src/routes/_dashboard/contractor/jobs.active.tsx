import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { ActiveJobsPage } from "@/features/contractor/jobs/components/ActiveJobsPage";

export const Route = createFileRoute("/_dashboard/contractor/jobs/active")({
  head: () => ({
    meta: [
      { title: "Active Jobs — HANDWERK" },
      {
        name: "description",
        content:
          "Your booked and in-progress jobs with progress tracking and one-tap access to the site diary.",
      },
    ],
  }),
  component: ActiveJobsRoute,
});

function ActiveJobsRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <ActiveJobsPage />
      </main>
      <BottomBar />
    </div>
  );
}
