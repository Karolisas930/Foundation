/**
 * ProjectTimelinePanel — timeline / milestones / desired-start /
 * scheduled site inspections / recent messages for the selected project.
 */
import { format } from "date-fns";
import { CalendarDays, ClipboardCheck, MessageSquare } from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";
import { safeParseISO, SLOT_LABEL, type SiteVisit } from "../../dashboard/components/parts/helpers";
import { Panel } from "../../dashboard/components/parts/Panel";
import { SubCard } from "../../dashboard/components/parts/SubCard";
import { MilestoneTimeline } from "../../dashboard/components/parts/MilestoneTimeline";

export function ProjectTimelinePanel({
  project,
  bidCount,
  siteVisit,
  messages,
}: {
  project: EcosystemProject;
  bidCount: number;
  siteVisit: SiteVisit | undefined;
  messages: { id: string; senderRole: string; text: string; timestamp: string }[];
}) {
  return (
    <Panel>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange/90">Timeline</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-white">Project milestones</h3>
      </div>

      <MilestoneTimeline
        status={project.status}
        bidCount={bidCount}
        siteVisit={siteVisit?.dates[0]}
      />

      <div className="mt-5 space-y-3">
        <SubCard icon={CalendarDays} title="Desired start">
          <div className="text-base font-semibold text-white">
            {project.desiredStart || "To be confirmed"}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            Flexible ± {project.flexibilityDays ?? 5} working days
          </div>
        </SubCard>

        <SubCard icon={ClipboardCheck} title="Scheduled site inspections">
          {(() => {
            if (siteVisit && siteVisit.dates.length > 0) {
              const ds = siteVisit.dates
                .map((d) => safeParseISO(d))
                .filter((d): d is Date => d !== null)
                .map((d) => format(d, "EEE d MMM"))
                .join(" · ");
              return (
                <p className="text-sm text-emerald-200">
                  Offered <span className="font-semibold text-white">{ds}</span>{" "}
                  <span className="text-slate-400">({SLOT_LABEL[siteVisit.slot]})</span>
                </p>
              );
            }
            return (
              <p className="text-sm text-slate-300">
                {project.status === "awarded"
                  ? "Use the Schedule site visit button above to offer dates."
                  : "No inspections booked yet. Accept a bid to schedule."}
              </p>
            );
          })()}
        </SubCard>

        <SubCard icon={MessageSquare} title={`Messages (${messages.length})`}>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-400">No messages yet.</p>
          ) : (
            <ul className="space-y-2">
              {messages.slice(-5).map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="line-clamp-2 text-sm text-slate-200">
                    <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                      {m.senderRole}
                    </span>
                    {m.text}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {m.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SubCard>
      </div>
    </Panel>
  );
}
