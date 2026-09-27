import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Radar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLeadFeed } from "@/features/contractor/leads/use-lead-feed";
import { tradeLabel } from "@/regions/trade-codes";
import { eur } from "./helpers";

/** Real open jobs from the database that match the signed-in pro's trades. */
export function MiniRadar() {
  const { i18n } = useTranslation();
  const { feed, isLoading } = useLeadFeed();
  const jobs = feed.priority.slice(0, 4);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange/15 text-orange">
            <Radar className="h-4 w-4 animate-dash-ping-slow" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-extrabold text-white">Job Radar</h3>
            <p className="text-[11px] text-white/50">
              {isLoading ? "Loading…" : `${feed.priority.length} matching your trades`}
            </p>
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
          {isLoading ? "Looking for jobs…" : "No matching jobs right now — check back soon."}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {jobs.map(({ job: j, classification }) => (
            <li key={j.id}>
              <Link
                to="/search"
                className="group block h-full rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-orange/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-[13px] font-semibold text-white group-hover:text-orange">
                    {j.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-orange/20 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-orange">
                    {classification.score.percent}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {j.city ?? j.locationZip}
                  </span>
                  <span className="font-mono font-semibold text-white/80">{eur(j.budgetTotal)}</span>
                </div>
                {j.trade ? (
                  <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/40">
                    {tradeLabel(j.trade, i18n.language)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
