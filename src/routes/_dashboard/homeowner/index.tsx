import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDashboard } from "@/routes/_dashboard/route";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useMyProjects } from "@/features/homeowner/dashboard/hooks/useMyProjects";
import { MyProjectsList } from "@/features/homeowner/jobs/components/MyProjectsList";
import { ProjectDetailsPanel } from "@/features/homeowner/jobs/components/ProjectDetailsPanel";

export const Route = createFileRoute("/_dashboard/homeowner/")({
  component: HomeownerDashboardPage,
});

function HomeownerDashboardPage() {
  const { displayName } = useDashboard();
  const { projects, isLoading } = useMyProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  function comingSoon(label: string) {
    toast.message(label, { description: "Coming in your next release." });
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{displayName ? `, ${displayName}` : ""}!
        </h1>

        {isLoading ? (
          <p className="text-sm text-slate-400">Loading your projects...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-slate-300">You haven't posted a project yet.</p>
            <Link
              to="/onboarding/profile"
              search={{ sector: "homeowner" }}
              className="mt-4 inline-block rounded-full bg-orange px-6 py-2.5 font-semibold text-white hover:bg-orange/90"
            >
              Post your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div className="space-y-3">
              <MyProjectsList
                projects={projects}
                proposals={[]}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div>
              {selected ? (
                <ProjectDetailsPanel
                  project={selected}
                  topProposal={null}
                  onEdit={() => comingSoon("Edit project")}
                  onChatContractor={() => comingSoon("Messaging a bidder")}
                />
              ) : (
                <p className="text-sm text-slate-400">
                  Select a project on the left to see its details.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
