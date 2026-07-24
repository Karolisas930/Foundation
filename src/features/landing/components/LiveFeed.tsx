import { Link } from "@tanstack/react-router";
import { Cpu, MapPin, Radio } from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";

const statusTone: Record<EcosystemProject["status"], string> = {
  open: "border-orange/40 bg-orange/15 text-orange-glow",
  clarifying: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  awarded: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  completed: "border-slate-700 bg-[#111424]/75 text-slate-400",
};

const CITIES = ["Mannheim", "Heidelberg", "Karlsruhe", "Stuttgart", "Freiburg", "Ulm", "Tübingen"];

export function LiveFeed({
  liveJobs,
  cityFilter,
  onCityChange,
}: {
  liveJobs: EcosystemProject[];
  cityFilter?: string;
  onCityChange: (city?: string) => void;
}) {
  return (
    <section id="live-feed" className="min-w-0 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Radio className="size-3.5" /> Live now
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Live BW job feed
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Telemetry straight from the ledger — updates the moment a new brief lands.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-glow">
          <span className="live-dot" /> {liveJobs.length} streaming
        </span>
      </div>

      <div
        id="city-filter"
        className="mt-6 scroll-mt-24 text-[11px] uppercase tracking-[0.3em] text-slate-400"
      >
        <div className="mb-2 px-1 text-orange-glow">BW Coverage · filter live feed</div>
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:whitespace-normal">
          {CITIES.map((c) => {
            const active = cityFilter?.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCityChange(active ? undefined : c)}
                className={
                  "shrink-0 min-h-[36px] rounded-full border px-3 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 active:scale-[0.98] " +
                  (active
                    ? "border-orange/60 bg-orange/15 text-orange-glow shadow-[0_0_0_1px_color-mix(in_oklab,var(--orange)_30%,transparent)]"
                    : "border-slate-700 bg-[#111424] text-slate-300 hover:border-orange/40 hover:bg-[#161b2e] hover:text-orange-glow")
                }
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
          {cityFilter && (
            <button
              type="button"
              onClick={() => onCityChange(undefined)}
              className="shrink-0 min-h-[36px] rounded-full border border-transparent px-3 py-1.5 text-orange-glow hover:text-orange"
            >
              Clear ×
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-[#111424]/70 p-3 backdrop-blur-sm sm:p-7">
        <ul className="grid min-h-[420px] grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          {liveJobs.slice(0, 6).map((p, i) => (
            <li
              key={p.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="ticker-in group min-w-0 rounded-xl border border-slate-800 bg-[#111424] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange/50 hover:bg-[#161b2e] sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[10px] tracking-wider text-slate-400">
                  {p.id}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="mt-1 break-words text-sm font-semibold text-white group-hover:text-orange-glow">
                {p.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-slate-300">
                <MapPin className="size-3 shrink-0 text-orange/70" />
                <span className="min-w-0 break-words">
                  {p.city ?? "BW"} · {p.locationZip}
                  {p.trade ? ` · ${p.trade}` : ""}
                </span>
              </div>
              <div className="mt-1.5 font-mono text-[11px] font-semibold text-orange-glow">
                € {p.budgetTotal.toLocaleString("de-DE")}{" "}
                <span className="text-slate-500">budget</span>
              </div>
            </li>
          ))}
          {liveJobs.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-700 bg-[#111424] p-6 text-center text-xs text-slate-400 lg:col-span-2">
              {cityFilter
                ? `No live jobs in ${cityFilter} right now.`
                : "No live jobs yet — be the first to post."}
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="size-3 text-orange/70" /> Auto-matched by skill + radius
          </span>
          <Link
            to="/onboarding/profile"
            search={{ sector: "handyman" }}
            className="font-semibold text-orange-glow transition hover:text-orange"
          >
            See all →
          </Link>
        </div>
      </div>
    </section>
  );
}
