import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDashboard } from "@/routes/_dashboard/route";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import type { EcosystemMessage, EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { getProjectThread, sendProjectMessage } from "@/lib/project-chat.functions";
import { useMyProjects } from "@/features/homeowner/dashboard/hooks/useMyProjects";
import {
  formatRelative,
  projectBidsKey,
  useProjectBids,
} from "@/features/homeowner/dashboard/hooks/useProjectBids";
import { MyProjectsList } from "@/features/homeowner/jobs/components/MyProjectsList";
import { ProjectDetailsPanel } from "@/features/homeowner/jobs/components/ProjectDetailsPanel";
import {
  EditProjectDialog,
  type EditDraft,
} from "@/features/homeowner/jobs/components/EditProjectDialog";
import { ChatView } from "@/features/homeowner/messages/components/ChatView";

export const Route = createFileRoute("/_dashboard/homeowner/")({
  head: () => ({
    meta: [
      { title: "My projects" },
      { name: "description", content: "See your posted projects, edit briefs and chat with bidders." },
      { property: "og:title", content: "My projects" },
      { property: "og:description", content: "See your posted projects, edit briefs and chat with bidders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeownerDashboardPage,
});

const EMPTY_EDIT_DRAFT: EditDraft = {
  title: "",
  description: "",
  budget: "",
  desiredStart: "",
  city: "",
  locationZip: "",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function HomeownerDashboardPage() {
  const { displayName } = useDashboard();
  const queryClient = useQueryClient();
  const { projects, isLoading } = useMyProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editingProject, setEditingProject] = useState<EcosystemProject | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(EMPTY_EDIT_DRAFT);
  const [chatBid, setChatBid] = useState<EcosystemProposal | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [sending, setSending] = useState(false);

  const threadFn = useServerFn(getProjectThread);
  const sendFn = useServerFn(sendProjectMessage);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const { proposals } = useProjectBids(selected?.id ?? null);

  const threadQuery = useQuery({
    queryKey: ["project-thread", selected?.id ?? null, chatBid?.profileId ?? null],
    queryFn: () => threadFn({ data: { jobId: selected!.id, peerId: chatBid!.profileId! } }),
    enabled: Boolean(selected && chatBid?.profileId),
    refetchInterval: chatBid ? 8000 : false,
  });

  const chatMessages: EcosystemMessage[] = useMemo(
    () =>
      (threadQuery.data?.messages ?? []).map((m) => ({
        id: m.id,
        projectId: selected?.id ?? "",
        senderRole: m.mine ? "homeowner" : "handyman",
        text: m.body,
        timestamp: formatRelative(m.createdAt) ?? "",
      })),
    [threadQuery.data, selected?.id],
  );

  function refreshProject() {
    void queryClient.invalidateQueries({ queryKey: ["my-projects"] });
    if (selected) void queryClient.invalidateQueries({ queryKey: projectBidsKey(selected.id) });
  }

  function openEdit(p: EcosystemProject) {
    setEditingProject(p);
    setEditDraft({
      title: p.title,
      description: p.description ?? "",
      budget: String(p.budgetTotal ?? ""),
      desiredStart: p.desiredStart ?? "",
      city: p.city ?? "",
      locationZip: p.locationZip ?? "",
    });
  }

  function openChat(b: EcosystemProposal) {
    if (!b.profileId) {
      toast.error("This bidder can't be messaged yet.");
      return;
    }
    setChatBid(b);
    setChatDraft("");
  }

  async function sendChat() {
    if (!chatBid?.profileId || !selected) return;
    const text = chatDraft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendFn({ data: { jobId: selected.id, peerId: chatBid.profileId, body: text } });
      setChatDraft("");
      await threadQuery.refetch();
    } catch (err) {
      toast.error(errorMessage(err, "Message could not be sent."));
    } finally {
      setSending(false);
    }
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
                proposals={proposals}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div>
              {selected ? (
                <ProjectDetailsPanel
                  project={selected}
                  topProposal={proposals[0] ?? null}
                  onEdit={() => openEdit(selected)}
                  onChatContractor={openChat}
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

      <ChatView
        bid={chatBid}
        messages={chatMessages}
        draft={chatDraft}
        sending={sending}
        loading={threadQuery.isLoading}
        onDraftChange={setChatDraft}
        onClose={() => {
          setChatBid(null);
          setChatDraft("");
        }}
        onSend={() => void sendChat()}
      />

      <EditProjectDialog
        project={editingProject}
        draft={editDraft}
        onDraftChange={setEditDraft}
        onClose={() => setEditingProject(null)}
        onSaved={() => {
          refreshProject();
          setEditingProject(null);
        }}
      />
    </DashboardLayout>
  );
}
