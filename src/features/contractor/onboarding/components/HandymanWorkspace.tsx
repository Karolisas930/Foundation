/**
 * src/components/HandymanWorkspace.tsx
 * Solo Tradesperson Cockpit & Ecosystem Sourcing Core.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendQuickQuestion, orderEcosystemSupply } from "@/lib/ecosystem-actions";
import {
  MapPin,
  MessageSquare,
  Send,
  Truck,
  Filter,
  ShieldCheck,
  Lock,
  Upload,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getHandymanCompletion,
  updateActiveHandymanProfile,
  readCredentialFile,
  type HandymanProfile,
} from "@/features/contractor/profile/profile-gate";
import { listContractorJobFeed, type ClassifiedJob } from "@/lib/job-feed.functions";
import type { LeadClassification } from "@/features/shared/matches/matching-engine";
import { acceptJobMatch } from "@/features/shared/matches/matches.functions";
import { CheckCircle2, Handshake } from "lucide-react";
import {
  deriveVerificationState,
  evaluateLeadGate,
  defaultTrialActive,
  maskPersonalField,
} from "@/features/contractor/leads/lead-gate";
import { ComplianceBanner, BlurredValue } from "@/components/shared/ComplianceBanner";

const SAMPLE_MATCHES: {
  id: string;
  trade: string;
  title: string;
  zip: string;
  km: number;
  budget: number;
  posted: string;
  summary: string;
}[] = [
  {
    id: "s1",
    trade: "Plumbing",
    title: "Replace leaking kitchen mixer + shut-off valve",
    zip: "70197",
    km: 6,
    budget: 320,
    posted: "2h ago",
    summary:
      "Single-lever tap drips constantly. Homeowner has the new fixture; needs a 1-hour visit and a fresh angle valve.",
  },
  {
    id: "s2",
    trade: "Electrical",
    title: "Install 3 ceiling spots in renovated bedroom",
    zip: "71034",
    km: 18,
    budget: 480,
    posted: "Yesterday",
    summary:
      "Concrete ceiling, conduits already pulled. Looking for a certified electrician for a clean Friday afternoon job.",
  },
  {
    id: "s3",
    trade: "Painting",
    title: "Repaint 42 m² living room — 2 coats, white",
    zip: "70173",
    km: 3,
    budget: 640,
    posted: "2 days ago",
    summary:
      "Furniture already moved out. Includes minor filler work around old picture hooks. Flexible on weekday timing.",
  },
];

export function HandymanWorkspace() {
  const [questionText, setQuestionText] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showOnlyMatches, setShowOnlyMatches] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | {
    kind: "quote" | "bid";
    projectId: string;
  }>(null);
  const [uploadingKind, setUploadingKind] = useState<null | "license" | "insurance">(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const [acceptedJobIds, setAcceptedJobIds] = useState<Set<string>>(new Set());
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const runAcceptJobMatch = useServerFn(acceptJobMatch);

  const handleAcceptLead = async (jobId: string) => {
    setAcceptingJobId(jobId);
    try {
      await runAcceptJobMatch({ data: { jobId } });
      setAcceptedJobIds((prev) => new Set(prev).add(jobId));
      toast.success("Lead accepted", {
        description: "Pending client confirmation — you'll be notified when they confirm.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept lead");
    } finally {
      setAcceptingJobId(null);
    }
  };

  const completion = getHandymanCompletion();
  const profile: HandymanProfile | null = completion.profile;
  const myTrades = profile?.trades ?? [];
  const myPostal = profile?.postalCode ?? "";
  const myRadius = profile?.radiusKm ?? 30;
  const profileComplete = completion.complete;

  // Compliance lead-gate — see src/lib/lead-gate.ts. Verification state is
  // derived from local credential uploads (moderation / profile_reports
  // flip this to under_review or flagged server-side). `is_trial_active`
  // defaults to TRUE across the launch window so the whole platform is
  // free right now; flipping INITIAL_FREE_TRIAL_UNTIL (or adding
  // has_active_subscription per profile) is the only switch needed.
  const verificationState = deriveVerificationState({
    hasLicenseDoc: Boolean(profile?.licenseDoc),
    hasInsuranceDoc: Boolean(profile?.insuranceDoc),
    flagged: false,
    openReportStatuses: [],
  });
  const leadGate = evaluateLeadGate({
    verificationState,
    isTrialActive: defaultTrialActive(),
    hasActiveSubscription: false,
  });

  // Real-data job feed from Supabase. The server function reads the
  // contractor's saved profile (min_project_size, service_radius_km,
  // postal_code, trades, languages) and returns jobs already scored
  // and split into priority + silent Alerts.
  const fetchFeed = useServerFn(listContractorJobFeed);
  const feedQuery = useQuery({
    queryKey: ["contractor-job-feed"],
    queryFn: () => fetchFeed(),
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const onLedger = () => feedQuery.refetch();
    window.addEventListener("chameleon_ledger_update", onLedger);
    return () => window.removeEventListener("chameleon_ledger_update", onLedger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priorityLeads: ClassifiedJob[] = feedQuery.data?.priority ?? [];
  const silentlyRoutedCount = feedQuery.data?.alerts.length ?? 0;
  const minProjectSize = feedQuery.data?.appliedThreshold ?? profile?.minProjectSize ?? 0;

  const matchingLeads = priorityLeads.filter((l) =>
    myTrades.length === 0 ? true : l.job.trade ? myTrades.includes(l.job.trade) : false,
  );
  const visibleLeads = showOnlyMatches ? matchingLeads : priorityLeads;
  const hasProfile = Boolean(profile && myTrades.length > 0);

  const handleSendQuestion = (projectId: string) => {
    if (!questionText.trim()) return;
    if (!profileComplete) {
      setPendingAction({ kind: "quote", projectId });
      setActiveProjectId(null);
      setGateOpen(true);
      return;
    }
    const success = sendQuickQuestion(projectId, questionText);
    if (success) {
      toast.success("Question transmitted", {
        description: "Your query was routed to the homeowner inbox.",
      });
      setQuestionText("");
      setActiveProjectId(null);
    }
  };

  const handleSubmitBid = (projectId: string) => {
    if (!profileComplete) {
      setPendingAction({ kind: "bid", projectId });
      setGateOpen(true);
      return;
    }
    const success = sendQuickQuestion(
      projectId,
      "Bid submitted — full quotation attached. Available to start within 2 weeks.",
    );
    if (success) {
      toast.success("Bid submitted", {
        description: "Your verified bid is now visible to the homeowner.",
      });
    }
  };

  const handleUploadCredential = async (kind: "license" | "insurance", file: File | null) => {
    if (!file) return;
    if (!profile) {
      toast.error("Complete onboarding first so we can attach credentials to your profile.");
      return;
    }
    try {
      setUploadingKind(kind);
      const doc = await readCredentialFile(file);
      updateActiveHandymanProfile(kind === "license" ? { licenseDoc: doc } : { insuranceDoc: doc });
      toast.success(
        kind === "license"
          ? "Trade license uploaded — verification pending."
          : "Insurance certificate uploaded — verification pending.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleOrderSupply = (projectId: string, lane: "disposal" | "logistics", item: string) => {
    const orderId = orderEcosystemSupply(projectId, lane, item);
    if (orderId) {
      toast.success("Ecosystem order placed", {
        description: `Successfully booked ${item}. Cost allocated to site finances.`,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      <div>
        <span className="text-xs font-bold text-orange uppercase tracking-wider">
          Solo Tradesperson Cockpit
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Marketplace Operations</h1>
      </div>

      {/* Profile completion banner */}
      <Card
        className={
          profileComplete ? "border-emerald-200 bg-emerald-50/50" : "border-orange/40 bg-orange/5"
        }
      >
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            {profileComplete ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <Lock className="h-5 w-5 text-orange" />
            )}
            <div>
              <p className="text-sm font-bold">
                {profileComplete
                  ? "Verified profile — bidding unlocked"
                  : "Complete profile to send quotes & bids"}
              </p>
              <p className="text-[11px] text-slate-500">
                {profileComplete
                  ? "Homeowners see your verification badge on every quote."
                  : completion.missing.length === 1
                    ? `1 step left: ${completion.missing[0]}`
                    : `${completion.missing.length} steps left to unlock bidding.`}
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <Progress value={completion.percent} className="h-2 bg-slate-200" />
            <p className="mt-1 text-[10px] text-slate-500 text-right">
              {completion.percent}% complete
            </p>
          </div>
          {!profileComplete && (
            <Button
              size="sm"
              className="bg-orange text-white hover:bg-orange/90 h-8 text-xs gap-1"
              onClick={() => {
                setPendingAction(null);
                setGateOpen(true);
              }}
            >
              <Upload className="h-3.5 w-3.5" /> Upload credentials
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Compliance lead-gate banner (German). Hidden once verified + trial/subscription active. */}
      <ComplianceBanner
        gate={leadGate}
        onUploadClick={() => {
          setPendingAction(null);
          setGateOpen(true);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Live leads stream */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Available Local Leads</CardTitle>
                <CardDescription>
                  {hasProfile
                    ? `Filtered to ${myTrades.length} trade${myTrades.length === 1 ? "" : "s"} within ${myRadius} km${myPostal ? ` of ${myPostal}` : ""}.`
                    : "Complete onboarding to filter leads by your trades and radius."}
                </CardDescription>
              </div>
              {hasProfile && (
                <Button
                  type="button"
                  variant={showOnlyMatches ? "default" : "outline"}
                  size="sm"
                  className={
                    showOnlyMatches
                      ? "h-8 gap-1.5 text-xs bg-orange text-white hover:bg-orange/90 shadow-md shadow-orange/30 transition-all active:scale-95"
                      : "h-8 gap-1.5 text-xs border-slate-300 hover:border-orange hover:text-orange transition-all active:scale-95"
                  }
                  aria-pressed={showOnlyMatches}
                  onClick={() => {
                    setShowOnlyMatches((v) => !v);
                    toast.message(
                      showOnlyMatches ? "Showing all open leads" : "Filtered to your trade matches",
                      {
                        description: showOnlyMatches
                          ? `${priorityLeads.length} leads visible`
                          : `${matchingLeads.length} matching leads`,
                      },
                    );
                  }}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {showOnlyMatches
                    ? `Matches (${matchingLeads.length})`
                    : `All leads (${priorityLeads.length})`}
                </Button>
              )}
            </div>
            {silentlyRoutedCount > 0 && (
              <p className="mt-2 text-[11px] text-slate-500">
                {silentlyRoutedCount} lower-value {silentlyRoutedCount === 1 ? "lead" : "leads"}{" "}
                below your €{minProjectSize.toLocaleString("de-DE")} threshold —{" "}
                <a href="/notifications" className="font-semibold text-orange hover:underline">
                  see them in Alerts
                </a>
                .
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleLeads.length === 0 && (
              <div className="space-y-3">
                <p className="rounded-md border border-dashed border-slate-200 p-3 text-center text-xs text-slate-500">
                  No live leads in your radius right now — here are recent jobs that matched trades
                  like yours.
                </p>
                {SAMPLE_MATCHES.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 transition-all hover:border-orange/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            {s.trade}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-orange/10 text-orange border-orange/30"
                          >
                            sample match
                          </Badge>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">
                            {s.posted}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-slate-900">{s.title}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3" /> PLZ {s.zip} · ~{s.km} km away
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">€{s.budget}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.summary}</p>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-slate-300 hover:border-orange hover:text-orange transition-all active:scale-95"
                        onClick={() =>
                          toast.message("Sample lead", {
                            description:
                              "Real homeowner leads appear here as soon as they're posted in your radius.",
                          })
                        }
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-orange text-white hover:bg-orange/90 transition-all active:scale-95"
                        onClick={() =>
                          toast.success("Saved to watchlist", {
                            description: "We'll alert you when a matching lead opens.",
                          })
                        }
                      >
                        Notify me
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visibleLeads.map((lead) => {
              const p = lead.job;
              const classification: LeadClassification = lead.classification;
              const distance = classification.score.distanceKm;
              const tradeMatch = p.trade ? myTrades.includes(p.trade) : false;
              const percent = classification.score.percent;
              const matchColor =
                percent >= 80
                  ? "bg-emerald-500 text-white"
                  : percent >= 60
                    ? "bg-orange text-white"
                    : "bg-slate-200 text-slate-700";
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                        <Badge
                          variant="outline"
                          className={
                            p.status === "clarifying"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
                          }
                        >
                          {p.status}
                        </Badge>
                        {hasProfile && tradeMatch && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            trade match
                          </Badge>
                        )}
                        {p.trade && !tradeMatch && hasProfile && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-500">
                            {p.trade}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-base mt-1">{p.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {leadGate.canViewPersonalInfo ? (
                          <>
                            PLZ {p.locationZip}
                            {p.city ? ` · ${p.city}` : ""}
                          </>
                        ) : (
                          <>
                            PLZ{" "}
                            <BlurredValue label="Verifizierung erforderlich">
                              {maskPersonalField(p.locationZip, "generic")}
                            </BlurredValue>
                          </>
                        )}
                        {distance !== null ? ` · ~${Math.round(distance)} km away` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${matchColor}`}
                        title={classification.score.reasons.join(" ")}
                      >
                        {percent}% match
                      </span>
                      <span className="text-sm font-extrabold">€{p.budgetTotal}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Dialog
                      open={activeProjectId === p.id}
                      onOpenChange={(open) => setActiveProjectId(open ? p.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Ask Quick Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Send Clarification Query</DialogTitle>
                          <DialogDescription className="text-xs">
                            Type a brief note to clarify dimensions, schedules, or access
                            parameters.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="e.g., Do you have on-site scaffolding prepared? What is the roof height?"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          className="text-xs min-h-[80px] mt-2"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveProjectId(null)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendQuestion(p.id)}
                            className="text-xs bg-orange text-white hover:bg-orange/90 gap-1"
                          >
                            {profileComplete ? (
                              <>
                                <Send className="h-3 w-3" /> Transmit Note
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" /> Complete profile to send
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitBid(p.id)}
                      className="h-8 text-xs bg-orange text-white hover:bg-orange/90 gap-1"
                    >
                      {profileComplete ? (
                        <>
                          <Send className="h-3.5 w-3.5" /> Submit Bid
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Submit Bid
                        </>
                      )}
                    </Button>
                    {acceptedJobIds.has(p.id) ? (
                      <span className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pending client confirmation
                      </span>
                    ) : leadGate.canUnlockLeads ? (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptLead(p.id)}
                        disabled={acceptingJobId === p.id}
                        className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1"
                      >
                        <Handshake className="h-3.5 w-3.5" />
                        {acceptingJobId === p.id ? "Accepting…" : "Accept Lead"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPendingAction(null);
                          setGateOpen(true);
                        }}
                        className="h-8 text-xs bg-amber-500 text-slate-900 hover:bg-amber-400 gap-1"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Verifizierung erforderlich
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* B2B On-Demand Supplier Cross-Sell Links */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange" /> Ecosystem Procurement Shop
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Instantly book site resources for active jobs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Disposal Category */}
              <div className="space-y-2">
                <h4 className="font-bold text-orange tracking-wider uppercase text-[10px]">
                  Disposal Containers (Entsorgung)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() =>
                      handleOrderSupply("PROJ-701", "disposal", "7m³ Mixed Debris Container")
                    }
                    variant="outline"
                    className="h-16 flex flex-col justify-center items-center text-slate-900 bg-white border-slate-700 hover:bg-slate-50 p-2 text-center"
                  >
                    <span className="font-bold text-[11px]">7m³ Debris Skip</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">€450 · Fix Price</span>
                  </Button>
                  <Button
                    onClick={() =>
                      handleOrderSupply("PROJ-701", "disposal", "10m³ Brick/Concrete Skip")
                    }
                    variant="outline"
                    className="h-16 flex flex-col justify-center items-center text-slate-900 bg-white border-slate-700 hover:bg-slate-50 p-2 text-center"
                  >
                    <span className="font-bold text-[11px]">10m³ Bauschutt</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">€620 · Fix Price</span>
                  </Button>
                </div>
              </div>

              {/* Machinery Rentals */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-orange tracking-wider uppercase text-[10px]">
                  Heavy Machinery & Logistics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() =>
                      handleOrderSupply("PROJ-701", "logistics", "Kubota Mini Excavator 1.5t")
                    }
                    variant="outline"
                    className="h-16 flex flex-col justify-center items-center text-slate-900 bg-white border-slate-700 hover:bg-slate-50 p-2 text-center"
                  >
                    <span className="font-bold text-[11px]">Mini Excavator</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">€180 / Day rental</span>
                  </Button>
                  <Button
                    onClick={() =>
                      handleOrderSupply("PROJ-701", "logistics", "Mobile Scaffolding Tower 6m")
                    }
                    variant="outline"
                    className="h-16 flex flex-col justify-center items-center text-slate-900 bg-white border-slate-700 hover:bg-slate-50 p-2 text-center"
                  >
                    <span className="font-bold text-[11px]">6m Scaffolding</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">€95 / Day rental</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile completion gate dialog */}
      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange" /> Verify your business to send quotes
            </DialogTitle>
            <DialogDescription className="text-xs">
              Browsing is open to everyone. To send quick quotes or submit bids, homeowners require
              a verified trade license and active liability insurance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Profile completion</span>
              <span className="text-slate-500">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="h-2 bg-slate-200" />
          </div>

          {completion.missing.length > 0 && (
            <ul className="text-[11px] text-slate-600 space-y-1 mt-2">
              {completion.missing.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange" /> {m}
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-2 mt-3">
            <CredentialUpload
              label="Trade license"
              hint="Handwerkskammer / Gewerbeschein (PDF or image)"
              doc={profile?.licenseDoc}
              busy={uploadingKind === "license"}
              onPick={() => licenseInputRef.current?.click()}
            />
            <CredentialUpload
              label="Liability insurance"
              hint="Active Betriebshaftpflicht certificate"
              doc={profile?.insuranceDoc}
              busy={uploadingKind === "insurance"}
              onPick={() => insuranceInputRef.current?.click()}
            />
          </div>

          <input
            ref={licenseInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              handleUploadCredential("license", e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <input
            ref={insuranceInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              handleUploadCredential("insurance", e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          {!profile && (
            <p className="rounded-md border border-dashed border-orange/40 bg-orange/5 p-2 text-[11px] text-orange-700">
              Finish onboarding first so credentials attach to your tradesperson profile.
            </p>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setGateOpen(false)}
            >
              Close
            </Button>
            {profileComplete && pendingAction && (
              <Button
                size="sm"
                className="text-xs bg-orange text-white hover:bg-orange/90"
                onClick={() => {
                  const action = pendingAction;
                  setGateOpen(false);
                  setPendingAction(null);
                  if (action.kind === "bid") handleSubmitBid(action.projectId);
                }}
              >
                Continue submission
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredentialUpload({
  label,
  hint,
  doc,
  busy,
  onPick,
}: {
  label: string;
  hint: string;
  doc?: { name: string; size: number } | undefined;
  busy: boolean;
  onPick: () => void;
}) {
  const uploaded = Boolean(doc);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy}
      className={`text-left rounded-lg border p-3 transition ${
        uploaded
          ? "border-emerald-300 bg-emerald-50"
          : "border-dashed border-slate-300 bg-white hover:border-orange/60 hover:bg-orange/5"
      }`}
    >
      <div className="flex items-center gap-2">
        {uploaded ? (
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Upload className="h-4 w-4 text-slate-500" />
        )}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">{hint}</p>
      {uploaded && doc ? (
        <p className="mt-2 truncate text-[10px] text-emerald-700">
          {doc.name} · {(doc.size / 1024).toFixed(0)} KB
        </p>
      ) : (
        <p className="mt-2 text-[10px] text-orange font-medium">
          {busy ? "Uploading…" : "Click to upload"}
        </p>
      )}
    </button>
  );
}
