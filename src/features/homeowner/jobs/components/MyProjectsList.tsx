/**
 * MyProjectsList — sidebar list of the homeowner's projects. Selecting
 * one raises it to the parent so ProjectDetailsPanel can render it.
 */
import { Handshake, MapPin, Wrench } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { statusLabel } from "../../dashboard/components/parts/helpers";
import { StatusPill } from "../../dashboard/components/parts/StatusPill";

export function MyProjectsList({
  projects,
  proposals,
  selectedId,
  onSelect,
}: {
  projects: EcosystemProject[];
  proposals: EcosystemProposal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
          My projects ({projects.length})
        </h2>
      </div>
      {[...projects].reverse().map((p) => {
        const bidCount = proposals.filter((b) => b.projectId === p.id).length;
        const isActive = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`group w-full rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99] ${
              isActive
                ? "border-orange/60 bg-orange/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--orange)_30%,transparent)]"
                : "border-white/10 bg-white/[0.03] hover:border-orange/40 hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-display text-base font-bold text-white">
                {p.title}
              </h3>
              <StatusPill status={p.status}>{statusLabel[p.status]}</StatusPill>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Wrench className="size-3 text-orange" /> {p.trade ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3 text-orange" />
                {p.city ?? "—"}
                {p.locationZip ? ` · ${p.locationZip}` : ""}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-300">€{p.budgetTotal.toLocaleString("de-DE")}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-orange-glow">
                <Handshake className="size-3" /> {bidCount} bid
                {bidCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <span
                className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-orange text-white"
                    : "bg-white/10 text-slate-200 group-hover:bg-orange group-hover:text-white"
                }`}
              >
                {isActive ? "Viewing" : "Manage"} →
              </span>
            </div>
          </button>
        );
      })}
    </>
  );
}
