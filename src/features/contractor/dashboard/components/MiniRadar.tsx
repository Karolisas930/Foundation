import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Radar } from "lucide-react";
import { getEcosystemLedger } from "@/core/demo-session";
import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";
import { eur } from "./helpers";

export function MiniRadar() {
  const profile = getActiveHandymanProfile();
  const trades = new Set((profile?.trades ?? []).map((t) => t.toLowerCase()));
  const ledger = getEcosystemLedger();

  const jobs = useMemo(() => {
    const open = ledger.projects.filter((p) => p.status === "open" || p.status === "clarifying");
    open.sort((a, b) => {
      const aM = a.trade && trades.has(a.trade.toLowerCase()) ? 1 : 0;
      const bM = b.trade && trades.has(b.trade.toLowerCase()) ? 1 : 0;
      return bM - aM || b.budgetTotal - a.budgetTotal;
    });
    return open.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger.projects.length, [...trades].join("|")]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange/15 text-orange">
            <Radar className="h-4 w-4 animate-dash-ping-slow" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-extrabold text-white">Job Radar</h3>
            <p className="text-[11px] text-white/50">{jobs.length} live near you</p>
          </div>
        </div>
        <Link
          to="/search"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-orange/40 hover:text-orange"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/50">
          No open projects right now — check back soon.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {jobs.map((j) => {
            const match = j.trade && trades.has(j.trade.toLowerCase());
            return (
              <li key={j.id}>
                <Link
                  to="/search"
                  className="group block h-full rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-orange/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[13px] font-semibold text-white group-hover:text-orange">
                      {j.title}
                    </p>
                    {match ? (
                      <span className="shrink-0 rounded-full bg-orange/20 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-orange">
                        Match
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {j.city ?? j.locationZip}
                    </span>
                    <span className="font-mono font-semibold text-white/80">
                      {eur(j.budgetTotal)}
                    </span>
                  </div>
                  {j.trade ? (
                    <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/40">
                      {j.trade}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
