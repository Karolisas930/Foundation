import { Award, CalendarCheck2, ClipboardCheck, Handshake, type Wrench } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { cn } from "@/lib/utils";
import type { SiteVisit } from "./helpers";

export function OverviewStats({
  projects,
  proposals,
  siteVisits,
}: {
  projects: EcosystemProject[];
  proposals: EcosystemProposal[];
  siteVisits: Record<string, SiteVisit>;
}) {
  const activeProjects = projects.filter((p) => p.status !== "completed").length;
  const totalBids = proposals.filter((b) =>
    projects.some((p) => p.id === b.projectId && p.status !== "completed"),
  ).length;
  const scheduledVisits = Object.values(siteVisits).reduce(
    (sum, v) => sum + (v?.dates?.length ?? 0),
    0,
  );
  const awarded = projects.filter((p) => p.status === "awarded").length;

  const items: Array<{
    label: string;
    value: number | string;
    icon: typeof Wrench;
    tint: string;
  }> = [
    { label: "Active projects", value: activeProjects, icon: ClipboardCheck, tint: "text-orange" },
    { label: "Incoming bids", value: totalBids, icon: Handshake, tint: "text-sky-300" },
    {
      label: "Scheduled visits",
      value: scheduledVisits,
      icon: CalendarCheck2,
      tint: "text-emerald-300",
    },
    { label: "Awarded", value: awarded, icon: Award, tint: "text-amber-300" },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tint }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {label}
            </span>
            <Icon className={cn("size-4 shrink-0", tint)} />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
