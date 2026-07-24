import { Briefcase, Plus } from "lucide-react";
import type { FilterKey } from "./ActiveJobsPage";

export function EmptyState({ hasQuery, filter }: { hasQuery: boolean; filter: FilterKey }) {
  const message = hasQuery
    ? "No jobs match your search. Try a different keyword."
    : filter === "overdue"
      ? "Nothing overdue. You're on top of things."
      : filter === "today"
        ? "No jobs scheduled for today. Enjoy the breather or line up new work."
        : filter === "week"
          ? "No jobs in the next 7 days. Great time to follow up on leads."
          : "No active jobs yet. Accept a lead or add one to get started.";
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white/[0.05] text-orange">
        <Briefcase className="size-6" />
      </div>
      <p className="font-display text-lg font-bold text-white">
        {filter === "overdue" ? "All clear" : "Nothing here yet"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{message}</p>
      {!hasQuery && filter !== "overdue" && (
        <a
          href="/auftraege"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2 text-sm font-bold text-slate-900 hover:bg-orange-glow"
        >
          <Plus className="size-4" />
          Browse open leads
        </a>
      )}
    </div>
  );
}
