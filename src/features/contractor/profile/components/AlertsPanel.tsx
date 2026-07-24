/**
 * AlertsPanel — thin coordinator. Owns the filter state and silent-alert
 * feed query, and delegates rendering to focused child modules.
 *
 * Silent-alert contract: leads appended here from the Matching Filter
 * Engine (budget < contractor's min_project_size) MUST NOT trigger
 * toasts, push notifications, or badge bursts. Rendering only.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wrench } from "lucide-react";

import { listContractorJobFeed } from "@/lib/job-feed.functions";

import { AlertsFilterPill } from "./AlertsFilterPill";
import { AlertsJobDrawer } from "./AlertsJobDrawer";
import { AlertsLeadCard } from "./AlertsLeadCard";
import { ALL_TRADES, type Lead, type PillId, type Prefs } from "./alerts-types";

export function AlertsPanel() {
  const [openLead, setOpenLead] = useState<Lead | null>(null);

  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [budgetThreshold, setBudgetThreshold] = useState<number>(500);

  const prefs: Prefs = {
    trade: selectedTrade ?? ALL_TRADES,
    distanceKm: maxDistance,
    budgetEur: budgetThreshold,
  };
  const setPrefs = (p: Prefs) => {
    setSelectedTrade(p.trade === ALL_TRADES ? null : p.trade);
    setMaxDistance(p.distanceKm);
    setBudgetThreshold(p.budgetEur);
  };

  const fetchFeed = useServerFn(listContractorJobFeed);
  const feedQuery = useQuery({
    queryKey: ["contractor-job-feed"],
    queryFn: () => fetchFeed(),
    refetchOnWindowFocus: true,
  });

  const silentAlerts = useMemo<Lead[]>(() => {
    const alerts = feedQuery.data?.alerts ?? [];
    return alerts.map((a) => {
      const km = a.classification.score.distanceKm;
      const reasons = a.classification.score.reasons;
      const reason =
        reasons.find((r) => r.includes("outside") || r.includes("below")) ??
        a.classification.reason ??
        reasons[0] ??
        "";
      const desc = a.job.description ?? "";
      return {
        id: `job-${a.job.id}`,
        title: a.job.title,
        location: a.job.city ?? (a.job.locationZip ? `PLZ ${a.job.locationZip}` : "—"),
        postedAgo: "just now",
        budgetEur: a.job.budgetTotal,
        trade: a.job.trade ?? undefined,
        distanceKm: typeof km === "number" ? Math.round(km) : undefined,
        snippet: reason ? `${reason} · ${desc}`.slice(0, 160) : desc.slice(0, 140),
        details: reason ? `${reason}\n\n${desc}` : desc,
        Icon: Wrench,
        iconTone: "from-slate-500/25 to-slate-500/5 text-slate-300 ring-slate-400/20",
      };
    });
  }, [feedQuery.data]);

  const leads = useMemo(() => {
    return silentAlerts.filter((lead) => {
      const tradeOk = selectedTrade === null || lead.trade === selectedTrade;
      const distanceOk = typeof lead.distanceKm !== "number" || lead.distanceKm <= maxDistance;
      const budgetOk = lead.budgetEur >= budgetThreshold;
      return tradeOk && distanceOk && budgetOk;
    });
  }, [silentAlerts, selectedTrade, maxDistance, budgetThreshold]);

  return (
    <section className="pb-6">
      <header className="mb-4">
        <h1 className="text-[22px] font-black tracking-tight text-white">
          Alerts &amp; Local Leads
        </h1>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
          Premium leads at or above your €{prefs.budgetEur.toLocaleString("de-DE")} threshold,
          within your core focus area.
        </p>
      </header>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["trade", "distance", "budget"] as PillId[]).map((id) => (
          <AlertsFilterPill key={id} id={id} prefs={prefs} setPrefs={setPrefs} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-[13px] text-muted-foreground">
            No leads match these filters. Widen your trade, distance or budget to see more.
          </div>
        ) : (
          leads.map((lead) => (
            <AlertsLeadCard key={lead.id} lead={lead} onOpen={() => setOpenLead(lead)} />
          ))
        )}
      </div>

      <AlertsJobDrawer
        lead={openLead}
        open={openLead !== null}
        onOpenChange={(o) => {
          if (!o) setOpenLead(null);
        }}
      />
    </section>
  );
}

export default AlertsPanel;
