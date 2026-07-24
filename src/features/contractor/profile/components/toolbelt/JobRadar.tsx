/**
 * JobRadar — Personalized "Job Radar — Your Area" section for the Toolbelt.
 *
 * Reads the active handyman profile (trades + city) from the ecosystem ledger
 * and surfaces trending projects in that area. Free users see aggregate
 * trending trades + a price band; premium users see per-job details plus
 * "Express Interest" / "Contact Client" actions.
 */
import { useEffect, useMemo, useState } from "react";
import { MapPin, Lock, Sparkles, MessageCircle, Send, Handshake, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";
import { getEcosystemLedger, type EcosystemProject } from "@/core/demo-session";
import {
  listHelpRequests,
  subscribeHelpRequests,
  HELP_REQUEST_KINDS,
  type HelpRequest,
} from "@/features/shared/help/help-requests";

const PREMIUM_KEY = "handwerk:isPremium";
const UPDATE_EVENT = "chameleon_ledger_update";

function useIsPremium(): [boolean, (v: boolean) => void] {
  const [premium, setPremium] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPremium(window.localStorage.getItem(PREMIUM_KEY) === "true");
    const onStorage = () => setPremium(window.localStorage.getItem(PREMIUM_KEY) === "true");
    window.addEventListener("storage", onStorage);
    window.addEventListener("handwerk:premium-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("handwerk:premium-change", onStorage);
    };
  }, []);
  const set = (v: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREMIUM_KEY, String(v));
    window.dispatchEvent(new Event("handwerk:premium-change"));
    setPremium(v);
  };
  return [premium, set];
}

function useLedgerTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(UPDATE_EVENT, bump);
    return () => window.removeEventListener(UPDATE_EVENT, bump);
  }, []);
  return tick;
}

type TrendingTrade = {
  trade: string;
  count: number;
  minBudget: number;
  maxBudget: number;
  avgBudget: number;
  sampleJobs: EcosystemProject[];
  momentum: "Rising fast" | "High demand" | "Steady";
};

function formatEur(n: number) {
  return `€${Math.round(n).toLocaleString("de-DE")}`;
}

function buildTrending(
  projects: EcosystemProject[],
  userTrades: string[],
  userCity: string | undefined,
): TrendingTrade[] {
  const cityLower = userCity?.toLowerCase();
  const tradeSet = new Set(userTrades.map((t) => t.toLowerCase()));
  const openish = projects.filter((p) => p.status === "open" || p.status === "clarifying");

  // Weight local jobs first; if user has no city, fall back to all.
  const scored = openish
    .map((p) => {
      const inArea = cityLower && p.city && p.city.toLowerCase() === cityLower;
      const tradeMatch = p.trade && tradeSet.has(p.trade.toLowerCase());
      return { p, inArea: Boolean(inArea), tradeMatch: Boolean(tradeMatch) };
    })
    .sort(
      (a, b) => Number(b.tradeMatch) - Number(a.tradeMatch) || Number(b.inArea) - Number(a.inArea),
    );

  const byTrade = new Map<string, EcosystemProject[]>();
  for (const { p } of scored) {
    const key = p.trade ?? "General";
    const arr = byTrade.get(key) ?? [];
    arr.push(p);
    byTrade.set(key, arr);
  }

  const trends: TrendingTrade[] = Array.from(byTrade.entries()).map(([trade, jobs]) => {
    const budgets = jobs.map((j) => j.budgetTotal).filter((n) => n > 0);
    const minBudget = budgets.length ? Math.min(...budgets) : 0;
    const maxBudget = budgets.length ? Math.max(...budgets) : 0;
    const avgBudget = budgets.length ? budgets.reduce((a, b) => a + b, 0) / budgets.length : 0;
    const momentum: TrendingTrade["momentum"] =
      jobs.length >= 3 ? "Rising fast" : jobs.length === 2 ? "High demand" : "Steady";
    return {
      trade,
      count: jobs.length,
      minBudget,
      maxBudget,
      avgBudget,
      sampleJobs: jobs,
      momentum,
    };
  });

  // Prioritise trades that match the user's selected trades.
  trends.sort((a, b) => {
    const aMatch = tradeSet.has(a.trade.toLowerCase()) ? 1 : 0;
    const bMatch = tradeSet.has(b.trade.toLowerCase()) ? 1 : 0;
    return bMatch - aMatch || b.count - a.count;
  });

  return trends.slice(0, 4);
}

export function JobRadar() {
  useLedgerTick();
  const [premium, setPremium] = useIsPremium();
  const [tab, setTab] = useState<"trending" | "collab">("trending");
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(() => listHelpRequests());
  useEffect(() => {
    setHelpRequests(listHelpRequests());
    return subscribeHelpRequests(() => setHelpRequests(listHelpRequests()));
  }, []);

  const profile = getActiveHandymanProfile();
  const trades = profile?.trades ?? [];
  const city = profile?.city;
  const postalCode = profile?.postalCode;
  const radiusKm = profile?.radiusKm;

  const ledger = getEcosystemLedger();
  const trending = useMemo(
    () => buildTrending(ledger.projects, trades, city),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger.projects, trades.join("|"), city],
  );

  const hasProfileArea = Boolean(city || postalCode);
  const totalNew = trending.reduce((sum, t) => sum + t.count, 0);

  const cityLower = city?.toLowerCase();
  const localHelp = useMemo(
    () => helpRequests.filter((h) => !cityLower || h.city.toLowerCase() === cityLower),
    [helpRequests, cityLower],
  );
  const helpList = localHelp.length > 0 ? localHelp : helpRequests;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <span className="text-orange">📡</span> Job Radar — Your Area
        </h4>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
            premium
              ? "bg-emerald-400/15 text-emerald-300 border border-emerald-300/30"
              : "bg-white/5 text-white/60 border border-white/10"
          }`}
        >
          {premium ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {premium ? "Premium" : "Free"}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        {hasProfileArea ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {city ?? postalCode}
            {radiusKm ? ` · ${radiusKm} km radius` : ""}
          </span>
        ) : (
          <>Set your city and trades in your profile to personalize this radar.</>
        )}
      </p>

      <div className="mb-4 mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setTab("trending")}
          className={`rounded-full px-3 py-1 transition ${
            tab === "trending" ? "bg-orange text-black" : "text-white/70 hover:text-white"
          }`}
        >
          Trending Jobs
        </button>
        <button
          type="button"
          onClick={() => setTab("collab")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
            tab === "collab" ? "bg-orange text-black" : "text-white/70 hover:text-white"
          }`}
        >
          <Handshake className="h-3 w-3" strokeWidth={1.75} />
          Collaboration / Help Needed
          {helpRequests.length > 0 && (
            <span
              className={`ml-1 rounded-full px-1.5 text-[10px] ${
                tab === "collab" ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
              }`}
            >
              {helpRequests.length}
            </span>
          )}
        </button>
      </div>

      {tab === "collab" ? (
        <CollaborationList requests={helpList} />
      ) : (
        <TrendingList trades={trades} trending={trending} totalNew={totalNew} premium={premium} />
      )}

      {!premium && tab === "trending" && (
        <div className="mt-5 rounded-xl border border-orange/25 bg-gradient-to-r from-orange/10 to-orange/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-orange shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">Unlock full job details</p>
              <p className="text-[11px] text-white/60 mt-0.5">
                See client info, exact budgets, and message homeowners directly with Premium.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPremium(true);
                toast.success("Premium preview enabled.");
              }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1.5 text-[11px] font-semibold text-black transition hover:brightness-110"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {premium && tab === "trending" && (
        <button
          type="button"
          onClick={() => setPremium(false)}
          className="mt-3 block w-full text-center text-[10px] uppercase tracking-widest text-white/35 hover:text-white/60"
        >
          Switch back to Free preview
        </button>
      )}

      <Button className="w-full mt-6 btn-glow">
        {tab === "collab" ? "Browse All Help Requests" : "Browse All Trending Projects"}
      </Button>
    </div>
  );
}

function TrendingList({
  trades,
  trending,
  totalNew,
  premium,
}: {
  trades: string[];
  trending: TrendingTrade[];
  totalNew: number;
  premium: boolean;
}) {
  return (
    <>
      {trades.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {trades.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[10px] font-medium text-orange"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mb-4">
        {totalNew > 0
          ? `${totalNew} trending job${totalNew === 1 ? "" : "s"} matching your trades this week`
          : "No trending jobs matched yet — check back soon."}
      </p>

      <div className="space-y-3">
        {trending.map((t) => (
          <div key={t.trade} className="rounded-xl bg-white/[0.05] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{t.trade}</p>
                <p className="text-xs text-emerald-400">{t.momentum}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-display font-bold text-white leading-none">{t.count}</p>
                <p className="text-[10px] text-slate-400">new jobs</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
              <span className="text-[11px] uppercase tracking-widest text-white/45">
                Avg. budget
              </span>
              <span className="font-display text-sm font-bold text-orange">
                {t.minBudget > 0 ? `${formatEur(t.minBudget)} – ${formatEur(t.maxBudget)}` : "—"}
              </span>
            </div>

            {premium ? (
              <div className="mt-3 space-y-2">
                {t.sampleJobs.slice(0, 2).map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-white/90">
                          {job.title}
                        </p>
                        <p className="text-[11px] text-white/50">
                          {job.city ?? job.locationZip} · {job.phase ?? "Planung"} ·{" "}
                          {formatEur(job.budgetTotal)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toast.success(`Interest sent for "${job.title}".`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-[11px] font-semibold text-orange transition hover:bg-orange/15"
                      >
                        <Send className="h-3 w-3" strokeWidth={1.75} />
                        Express Interest
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toast.success(`Message drafted to client for "${job.title}".`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition hover:border-orange/40 hover:text-orange"
                      >
                        <MessageCircle className="h-3 w-3" strokeWidth={1.75} />
                        Contact Client
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/55">
                <Lock className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                <span>
                  Full job details &amp; client contact available on{" "}
                  <span className="font-semibold text-white/80">Premium</span>.
                </span>
              </div>
            )}
          </div>
        ))}

        {trending.length === 0 && (
          <div className="rounded-xl bg-white/[0.03] p-4 text-sm text-white/55">
            No trending projects in your area yet.
          </div>
        )}
      </div>
    </>
  );
}

function CollaborationList({ requests }: { requests: HelpRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl bg-white/[0.03] p-4 text-sm text-white/55">
        No help requests yet. Post one from the Jobs menu to reach nearby trades.
      </div>
    );
  }
  const kindLabel = (v: HelpRequest["kind"]) =>
    HELP_REQUEST_KINDS.find((k) => k.value === v)?.label ?? v;
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-xl bg-white/[0.05] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{r.title}</p>
              <p className="text-[11px] text-white/55">
                {r.trade} · {r.city}
                {r.startDate ? ` · from ${r.startDate}` : ""}
                {r.durationDays ? ` · ${r.durationDays}d` : ""}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange">
              {kindLabel(r.kind)}
            </span>
          </div>
          <p className="mt-2 line-clamp-3 text-[12px] text-white/70">{r.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toast.success(`Interest sent to ${r.contactName}.`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-[11px] font-semibold text-orange transition hover:bg-orange/15"
            >
              <Send className="h-3 w-3" strokeWidth={1.75} />I can help
            </button>
            {r.contactPhone && (
              <a
                href={`tel:${r.contactPhone}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition hover:border-orange/40 hover:text-orange"
              >
                <Phone className="h-3 w-3" strokeWidth={1.75} />
                Call {r.contactName}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
