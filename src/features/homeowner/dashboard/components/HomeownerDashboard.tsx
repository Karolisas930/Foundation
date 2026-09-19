/**
 * HomeownerDashboard — thin coordinator for the private-client dashboard.
 *
 * Owns cross-cutting state (selected project, chat/profile/edit modal
 * targets, site-visit map) and delegates each surface to a dedicated
 * component under `src/features/homeowner/jobs/components/`.
 *
 * Data comes from Supabase via server functions:
 *  - projects: `listMyProjects`            (src/lib/homeowner-projects.functions.ts)
 *  - bids:     `listBidsForMyProject` etc. (src/lib/job-bids.functions.ts)
 *  - chat:     `getProjectThread` etc.     (src/lib/project-chat.functions.ts)
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

import type { EcosystemMessage, EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import {
  acceptProjectBid,
  cancelProjectAward,
  declineProjectBid,
} from "@/lib/job-bids.functions";
import { getProjectThread, sendProjectMessage } from "@/lib/project-chat.functions";
import { getMatchScore, type TimeSlot } from "./parts/helpers";
import { AISummaryCard } from "./parts/AISummaryCard";
import { LiveActivityFeed } from "./parts/LiveActivityFeed";
import { OverviewStats } from "./parts/OverviewStats";
import { QuickActionsBar } from "./parts/QuickActionsBar";
import { useMyProjects } from "../hooks/useMyProjects";
import { formatRelative, projectBidsKey, useProjectBids } from "../hooks/useProjectBids";

import { MyProjectsList } from "@/features/homeowner/jobs/components/MyProjectsList";
import { ProjectDetailsPanel } from "@/features/homeowner/jobs/components/ProjectDetailsPanel";
import { SiteVisitScheduler } from "@/features/homeowner/jobs/components/SiteVisitScheduler";
import { ProposalsPanel } from "@/features/homeowner/jobs/components/ProposalsPanel";
import { ProjectTimelinePanel } from "@/features/homeowner/jobs/components/ProjectTimelinePanel";
import { ChatView } from "@/features/homeowner/messages/components/ChatView";
import { ContractorProfileDialog } from "@/features/homeowner/jobs/components/ContractorProfileDialog";
import { CancelAcceptanceDialog } from "@/features/homeowner/jobs/components/CancelAcceptanceDialog";
import {
  EditProjectDialog,
  type EditDraft,
} from "@/features/homeowner/jobs/components/EditProjectDialog";
import { useSiteVisits } from "@/features/homeowner/jobs/components/use-site-visits";

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

export function HomeownerDashboard() {
  const queryClient = useQueryClient();
  const { projects, isLoading: projectsLoading, error: projectsError } = useMyProjects();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatBid, setChatBid] = useState<EcosystemProposal | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [profileBid, setProfileBid] = useState<EcosystemProposal | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftSlot, setDraftSlot] = useState<TimeSlot>("morning");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [busyBidId, setBusyBidId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<EcosystemProject | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(EMPTY_EDIT_DRAFT);
  const { siteVisits, saveVisit, clearVisit } = useSiteVisits();

  const acceptFn = useServerFn(acceptProjectBid);
  const declineFn = useServerFn(declineProjectBid);
  const cancelFn = useServerFn(cancelProjectAward);
  const threadFn = useServerFn(getProjectThread);
  const sendFn = useServerFn(sendProjectMessage);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;
    if (!selectedId || !projects.some((p) => p.id === selectedId)) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const { bids, proposals } = useProjectBids(selected?.id ?? null);
  const acceptedBid = bids.find((b) => b.status === "accepted") ?? null;

  /* ------------------------------------------------------------- chat */

  const threadQuery = useQuery({
    queryKey: ["project-thread", selected?.id ?? null, chatBid?.profileId ?? null],
    queryFn: () =>
      threadFn({
        data: { jobId: selected!.id, peerId: chatBid!.profileId! },
      }),
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

  async function acceptBid(bid: EcosystemProposal) {
    if (!selected || busyBidId) return;
    setBusyBidId(bid.id);
    try {
      await acceptFn({ data: { bidId: bid.id } });
      refreshProject();
      toast.success(`Bid accepted — ${bid.company} will contact you within 24h.`, {
        description: "Scroll down for next steps and to chat with your contractor.",
        duration: 6000,
      });
    } catch (err) {
      toast.error(errorMessage(err, "Could not accept this bid."));
    } finally {
      setBusyBidId(null);
    }
  }

  async function declineBid(bid: EcosystemProposal) {
    if (!selected || busyBidId) return;
    setBusyBidId(bid.id);
    try {
      await declineFn({ data: { bidId: bid.id } });
      refreshProject();
      toast.success(`Bid from ${bid.company} declined.`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not decline this bid."));
    } finally {
      setBusyBidId(null);
    }
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

  async function cancelAcceptedBid() {
    const reason = cancelReason.trim();
    if (reason.length < 10) {
      toast.error("Please share a brief reason (10+ characters).");
      return;
    }
    if (!selected || !acceptedBid || cancelling) return;
    setCancelling(true);
    try {
      await cancelFn({ data: { bidId: acceptedBid.id, reason } });
      await clearVisit(selected.id).catch(() => undefined);
      refreshProject();
      setCancelOpen(false);
      setCancelReason("");
      toast.success("Acceptance cancelled — contractor has been notified.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not cancel the acceptance."));
    } finally {
      setCancelling(false);
    }
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
    setChatBid(b);
    setChatDraft("");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--navy-ink)] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] orange-aurora opacity-60"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Homeowner control tower
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your project dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Live status, incoming bids, and scheduled site visits — all in one place.
            </p>
          </div>
          <Button
            asChild
            className="h-12 gap-2 rounded-full bg-orange px-5 text-sm font-semibold text-white hover:bg-orange/90"
          >
            <Link to="/onboarding/profile" search={{ sector: "homeowner" }}>
              <PlusCircle className="size-4" /> Post a new project
            </Link>
          </Button>
        </header>

        {projectsLoading ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
            Loading your projects…
          </div>
        ) : projectsError ? (
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center text-slate-200">
            {errorMessage(projectsError, "Your projects could not be loaded.")}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
            No projects yet. Post one to see live bids stream in.
          </div>
        ) : (
          <>
            <OverviewStats projects={projects} proposals={proposals} siteVisits={siteVisits} />
            <QuickActionsBar
              onScrollToBids={() => {
                if (typeof document === "undefined") return;
                document.getElementById("bids-panel")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            />
          </>
        )}

        {projects.length > 0 && (
          <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
              <MyProjectsList
                projects={projects}
                proposals={proposals}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <LiveActivityFeed projects={projects} proposals={proposals} messages={chatMessages} />
            </aside>

            <div className="min-w-0 space-y-6">
              {selected && (
                <>
                  <AISummaryCard
                    project={selected}
                    bidCount={proposals.length}
                    bestMatch={
                      proposals.length
                        ? proposals
                            .map((b) => ({ b, s: getMatchScore(b.id) }))
                            .sort((a, z) => z.s - a.s)[0]
                        : null
                    }
                  />
                  <ProjectDetailsPanel
                    project={selected}
                    topProposal={proposals[0] ?? null}
                    onEdit={() => openEdit(selected)}
                    onChatContractor={openChat}
                  />
                  {selected.status === "awarded" && proposals[0] && (
                    <SiteVisitScheduler
                      project={selected}
                      topProposal={proposals[0]}
                      siteVisits={siteVisits}
                      saveVisit={saveVisit}
                      calendarOpen={calendarOpen}
                      setCalendarOpen={setCalendarOpen}
                      draftSlot={draftSlot}
                      setDraftSlot={setDraftSlot}
                      onCancelRequest={() => {
                        setCancelReason("");
                        setCancelOpen(true);
                      }}
                    />
                  )}
                  <ProposalsPanel
                    project={selected}
                    proposals={proposals}
                    busyBidId={busyBidId}
                    onChat={openChat}
                    onAccept={(b) => void acceptBid(b)}
                    onDecline={(b) => void declineBid(b)}
                    onOpenProfile={setProfileBid}
                  />
                  <ProjectTimelinePanel
                    project={selected}
                    bidCount={proposals.length}
                    siteVisit={siteVisits[selected.id]}
                    messages={chatMessages}
                  />
                </>
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

      <ContractorProfileDialog
        bid={profileBid}
        onClose={() => setProfileBid(null)}
        onMessage={(b) => {
          openChat(b);
          setProfileBid(null);
        }}
      />

      <CancelAcceptanceDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (cancelling) return;
          setCancelOpen(open);
          if (!open) setCancelReason("");
        }}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={() => void cancelAcceptedBid()}
      />

      <EditProjectDialog
        project={editingProject}
        draft={editDraft}
        onDraftChange={setEditDraft}
        onClose={() => setEditingProject(null)}
        onSaved={refreshProject}
      />
    </div>
  );
}

export default HomeownerDashboard;
