import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { TeamPage } from "@/features/contractor/team/components/TeamPage";

export const Route = createFileRoute("/_dashboard/contractor/team")({
  head: () => ({
    meta: [
      { title: "Team & Staff — HANDWERK" },
      {
        name: "description",
        content:
          "Manage your Handwerk crew: staff overview, roles (Master Craftsman, Journeyman, Apprentice, Office, Subcontractor), permission groups, documents, and activity.",
      },
    ],
  }),
  component: TeamRoute,
});

function TeamRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <TeamPage />
      </main>
      <BottomBar />
    </div>
  );
}
