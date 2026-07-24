import { Brain, Handshake, type MapPin, Target, TrendingUp } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { cn } from "@/lib/utils";

function SummaryStat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon?: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  tone?: "emerald";
}) {
  return (
    <div className="group/stat rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 backdrop-blur transition hover:border-orange/40 hover:bg-white/[0.08]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {Icon && <Icon className="size-3 text-orange/80" />}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-lg font-extrabold leading-none tabular-nums",
          tone === "emerald" ? "text-emerald-300" : "text-white",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-[10px] text-slate-400">{sub}</div>}
    </div>
  );
}

export function AISummaryCard({
  project,
  bidCount,
  bestMatch,
}: {
  project: EcosystemProject;
  bidCount: number;
  bestMatch: { b: EcosystemProposal; s: number } | null;
}) {
  const avg = bestMatch
    ? Math.round(bestMatch.b.labor + bestMatch.b.materials + bestMatch.b.travel)
    : 0;
  const insight =
    bidCount === 0
      ? "Your brief is live — matched contractors are reviewing it now."
      : bestMatch && bestMatch.s >= 90
        ? `${bestMatch.b.company} is a top-tier fit. Lock them in for the fastest start.`
        : bestMatch
          ? `${bestMatch.b.company} leads on price-to-quality. Compare profiles before accepting.`
          : "Reviewing incoming bids…";

  return (
    <section className="ai-halo group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange/15 via-white/[0.04] to-sky-500/10 p-5 ai-breath backdrop-blur-xl transition hover:border-orange/40 sm:p-6">
      <span aria-hidden className="ai-halo-bg rounded-2xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-orange/20 blur-3xl transition group-hover:bg-orange/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-sky-400/10 blur-3xl"
      />
      <div className="relative z-10 flex items-start gap-4">
        <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-orange/60 text-white shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--orange)_80%,transparent)] ring-1 ring-orange/50">
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-orange/30 blur-md animate-pulse"
          />
          <Brain className="relative size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange/90">
              AI smart summary
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-glow">
              <span className="live-dot !size-1.5" /> Live
            </span>
          </div>
          <h3 className="mt-1 font-display text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {project.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-200">{insight}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <SummaryStat
              icon={Handshake}
              label="Bids"
              value={String(bidCount)}
              sub={bidCount ? "incoming" : "waiting"}
            />
            <SummaryStat
              icon={Target}
              label="Top match"
              value={bestMatch ? `${bestMatch.s}%` : "—"}
              sub={bestMatch?.b.company.split(" ")[0]}
              tone="emerald"
            />
            <SummaryStat
              icon={TrendingUp}
              label="Best offer"
              value={avg ? `€${avg.toLocaleString("de-DE")}` : "—"}
              sub={avg ? "all-in" : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
