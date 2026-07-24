import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { CalendarPage } from "@/features/contractor/calendar/components/CalendarPage";

export const Route = createFileRoute("/_dashboard/contractor/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — HANDWERK" },
      {
        name: "description",
        content: "See approved marketplace jobs, homeowner availability, and confirm dates.",
      },
    ],
  }),
  component: CalendarRoute,
});

function CalendarRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <CalendarPage />
      </main>
      <BottomBar />
    </div>
  );
}
