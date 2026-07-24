import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { DailyLog } from "@/features/contractor/team/components/DailyLog";

export const Route = createFileRoute("/_dashboard/contractor/daily-log")({
  head: () => ({
    meta: [
      { title: "Daily Log — HANDWERK" },
      {
        name: "description",
        content:
          "Site diary for your crew — log working hours, upload receipts and expenses, and capture before/after job photos.",
      },
    ],
  }),
  component: DailyLogRoute,
});

function DailyLogRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <DailyLog />
      </main>
      <BottomBar />
    </div>
  );
}
