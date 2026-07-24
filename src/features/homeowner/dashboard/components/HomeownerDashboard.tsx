/**
 * HomeownerDashboard — thin coordinator for the private-client dashboard.
 *
 * Owns cross-cutting state (selected project, chat/profile/edit modal
 * targets, site-visit map) and delegates each surface to a dedicated
 * component under `src/features/homeowner/jobs/components/`.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

import {
  getEcosystemLedger,
  updateEcosystemLedger,
  type EcosystemProject,
  type EcosystemProposal,
} from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import { getMatchScore, type TimeSlot } from "./parts/helpers";
import { AISummaryCard } from "./parts/AISummaryCard";
import { LiveActivityFeed } from "./parts/LiveActivityFeed";
import { OverviewStats } from "./parts/OverviewStats";
import { QuickActionsBar } from "./parts/QuickActionsBar";

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

export function HomeownerDashboard() {
  const [ledger, setLedger] = useState(getEcosystemLedger);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatBid, setChatBid] = useState<EcosystemProposal | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [profileBid, setProfileBid] = useState<EcosystemProposal | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftSlot, setDraftSlot] = useState<TimeSlot>("morning");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editingProject, setEditingProject] = useState<EcosystemProject | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(EMPTY_EDIT_DRAFT);
  const { siteVisits, persistSiteVisits } = useSiteVisits();

  useEffect(() => {
    const handler = () => setLedger(getEcosystemLedger());
    window.addEventListener("chameleon_ledger_update", handler);
    return () => window.removeEventListener("chameleon_ledger_update", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const projects = ledger.projects ?? [];

  useEffect(() => {
    if (!selectedId && projects.length > 0) {
      setSelectedId(projects[projects.length - 1].id);
    }
  }, [projects, selectedId]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const proposals = useMemo(
    () => (selected ? (ledger.proposals ?? []).filter((b) => b.projectId === selected.id) : []),
    [ledger.proposals, selected],
  );

  const messages = useMemo(
    () => (selected ? ledger.messages.filter((m) => m.projectId === selected.id) : []),
    [ledger.messages, selected],
  );

  function acceptBid(bid: EcosystemProposal) {
    if (!selected) return;
    const next = getEcosystemLedger();
    next.projects = next.projects.map((p) =>
      p.id === selected.id ? { ...p, status: "awarded" as const } : p,
    );
    next.proposals = (next.proposals ?? []).filter(
      (b) => b.projectId !== selected.id || b.id === bid.id,
    );
    next.messages = [
      ...next.messages,
      {
        id: `MSG-${Date.now()}`,
        projectId: selected.id,
        senderRole: "homeowner",
        text: `Bid accepted from ${bid.company}. Let's schedule the site visit.`,
        timestamp: "just now",
      },
    ];
    updateEcosystemLedger(next);
    toast.success(`Bid accepted — ${bid.company} will contact you within 24h.`, {
      description: "Scroll down for next steps and to chat with your contractor.",
      duration: 6000,
    });
  }

  function sendChat() {
    if (!chatBid || !selected) return;
    const text = chatDraft.trim();
    if (!text) return;
    const next = getEcosystemLedger();
    next.messages = [
      ...next.messages,
      {
        id: `MSG-${Date.now()}`,
        projectId: selected.id,
        senderRole: "homeowner",
        text: `[${chatBid.company}] ${text}`,
        timestamp: "just now",
      },
    ];
    updateEcosystemLedger(next);
    setChatDraft("");
    toast.success("Message sent.");
  }

  function cancelAcceptedBid() {
    const reason = cancelReason.trim();
    if (reason.length < 10) {
      toast.error("Please share a brief reason (10+ characters).");
      return;
    }
    if (!selected) return;
    const next = getEcosystemLedger();
    next.projects = next.projects.map((p) =>
      p.id === selected.id ? { ...p, status: "clarifying" as const } : p,
    );
    next.messages = [
      ...next.messages,
      {
        id: `MSG-${Date.now()}`,
        projectId: selected.id,
        senderRole: "homeowner",
        text: `Acceptance cancelled. Reason: ${reason}`,
        timestamp: "just now",
      },
    ];
    updateEcosystemLedger(next);
    const cleared = { ...siteVisits };
    delete cleared[selected.id];
    persistSiteVisits(cleared);
    setCancelOpen(false);
    setCancelReason("");
    toast.success("Acceptance cancelled — contractor has been notified.");
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

        {projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
            No projects yet. Post one to see live bids stream in.
          </div>
        ) : (
          <>
            <OverviewStats
              projects={projects}
              proposals={ledger.proposals ?? []}
              siteVisits={siteVisits}
            />
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
                proposals={ledger.proposals ?? []}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <LiveActivityFeed
                projects={projects}
                proposals={ledger.proposals ?? []}
                messages={ledger.messages ?? []}
              />
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
                    onChatContractor={(b) => {
                      setChatBid(b);
                      setChatDraft("");
                    }}
                  />
                  {selected.status === "awarded" && proposals[0] && (
                    <SiteVisitScheduler
                      project={selected}
                      topProposal={proposals[0]}
                      siteVisits={siteVisits}
                      persistSiteVisits={persistSiteVisits}
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
                    onChat={(b) => {
                      setChatBid(b);
                      setChatDraft("");
                    }}
                    onAccept={acceptBid}
                    onOpenProfile={setProfileBid}
                  />
                  <ProjectTimelinePanel
                    project={selected}
                    bidCount={proposals.length}
                    siteVisit={siteVisits[selected.id]}
                    messages={messages}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ChatView
        bid={chatBid}
        messages={messages}
        draft={chatDraft}
        onDraftChange={setChatDraft}
        onClose={() => {
          setChatBid(null);
          setChatDraft("");
        }}
        onSend={sendChat}
      />

      <ContractorProfileDialog
        bid={profileBid}
        onClose={() => setProfileBid(null)}
        onMessage={(b) => {
          setChatBid(b);
          setChatDraft("");
          setProfileBid(null);
        }}
      />

      <CancelAcceptanceDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason("");
        }}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={cancelAcceptedBid}
      />

      <EditProjectDialog
        project={editingProject}
        draft={editDraft}
        onDraftChange={setEditDraft}
        onClose={() => setEditingProject(null)}
        onSaved={(next) => setLedger(next)}
      />
    </div>
  );
}

export default HomeownerDashboard;
