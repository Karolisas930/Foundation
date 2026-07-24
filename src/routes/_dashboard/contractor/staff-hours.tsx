import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { StaffHoursPage } from "@/features/contractor/timesheets/components/StaffHoursPage";

export const Route = createFileRoute("/_dashboard/contractor/staff-hours")({
  head: () => ({
    meta: [
      { title: "Staff Hours — HANDWERK" },
      {
        name: "description",
        content:
          "Review all working hours logged by your staff with filters, search, summary totals, and CSV export.",
      },
    ],
  }),
  component: StaffHoursRoute,
});

function StaffHoursRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <StaffHoursPage />
      </main>
      <BottomBar />
    </div>
  );
}
