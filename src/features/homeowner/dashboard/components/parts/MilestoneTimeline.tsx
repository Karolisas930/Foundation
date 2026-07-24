import { CheckCircle2, Circle, CircleDot, TrendingUp } from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";
import { cn } from "@/lib/utils";

export function MilestoneTimeline({
  status,
  bidCount,
  siteVisit,
}: {
  status: EcosystemProject["status"];
  bidCount: number;
  siteVisit?: string;
}) {
  const steps = [
    { key: "posted", label: "Project posted", done: true },
    { key: "bids", label: "Bids received", done: bidCount > 0 },
    {
      key: "awarded",
      label: "Contractor awarded",
      done: status === "awarded" || status === "completed",
    },
    { key: "visit", label: "Site visit scheduled", done: !!siteVisit },
    { key: "work", label: "Work in progress", done: status === "completed" },
    { key: "done", label: "Completed", done: status === "completed" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300">
          <TrendingUp className="size-3.5 text-orange" /> Progress
        </span>
        <span className="font-display text-sm font-extrabold text-white tabular-nums">{pct}%</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange via-orange/80 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {steps.map((s, i) => {
          const active = !s.done && steps.slice(0, i).every((p) => p.done);
          return (
            <li
              key={s.key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition",
                s.done
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : active
                    ? "border-orange/40 bg-orange/10 text-orange"
                    : "border-white/10 bg-white/[0.02] text-slate-500",
              )}
            >
              {s.done ? (
                <CheckCircle2 className="size-3.5 shrink-0" />
              ) : active ? (
                <CircleDot className="size-3.5 shrink-0 animate-pulse" />
              ) : (
                <Circle className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
