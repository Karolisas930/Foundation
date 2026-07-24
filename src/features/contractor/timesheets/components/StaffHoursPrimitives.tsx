/**
 * Small presentational primitives used across the Staff Hours page:
 * SortButton, StatusBadge, RowActions, SummaryCard, MiniStat, EmptyState.
 */
import { Ban, Check, CheckCircle2, Clock3, Inbox, Lightbulb, Pencil, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Status } from "./staff-hours-utils";

export function SortButton({
  children,
  active,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center text-xs font-medium uppercase tracking-wide transition-colors ${
        active ? "text-white" : "text-slate-300 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300 line-through decoration-rose-400/60">
        <XCircle className="h-3 w-3 no-underline" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
      <Clock3 className="h-3 w-3" />
      Pending
    </span>
  );
}

export function RowActions({
  status,
  onChange,
  onEdit,
  size = "sm",
}: {
  status: Status;
  onChange: (s: Status) => void;
  onEdit?: () => void;
  size?: "sm" | "xs";
}) {
  const btn = size === "xs" ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-xs";
  return (
    <div className="inline-flex items-center gap-1.5">
      {onEdit && (
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className={`${btn} gap-1 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white`}
          title="Edit entry"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
      <Button
        type="button"
        variant={status === "approved" ? "default" : "outline"}
        onClick={() => onChange(status === "approved" ? "pending" : "approved")}
        className={`${btn} gap-1 ${
          status === "approved"
            ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border-emerald-400/30"
            : "border-white/10 text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-200"
        }`}
        title={status === "approved" ? "Undo approve" : "Approve"}
      >
        <Check className="h-3.5 w-3.5" />
        {status === "approved" ? "Approved" : "Approve"}
      </Button>
      <Button
        type="button"
        variant={status === "rejected" ? "default" : "outline"}
        onClick={() => onChange(status === "rejected" ? "pending" : "rejected")}
        className={`${btn} gap-1 ${
          status === "rejected"
            ? "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border-rose-400/30"
            : "border-white/10 text-slate-200 hover:bg-rose-500/10 hover:text-rose-200"
        }`}
        title={status === "rejected" ? "Undo reject" : "Reject"}
      >
        <Ban className="h-3.5 w-3.5" />
        {status === "rejected" ? "Rejected" : "Reject"}
      </Button>
    </div>
  );
}

export function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 hover:bg-white/[0.07]">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-400">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

export function MiniStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald";
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent === "emerald"
          ? "border-emerald-400/20 bg-emerald-500/5"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${
          accent === "emerald" ? "text-emerald-200" : "text-white"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ hasAnyRows, onReset }: { hasAnyRows: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-white">
        {hasAnyRows ? "No hours match these filters" : "No hours logged yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">
        {hasAnyRows
          ? "Try widening the date range, choosing a different staff member, or clearing your search."
          : "Once your team starts logging their working hours, you'll see a full breakdown here."}
      </p>

      {hasAnyRows ? (
        <Button type="button" variant="outline" size="sm" onClick={onReset} className="mt-4">
          Reset filters
        </Button>
      ) : (
        <div className="mt-5 flex max-w-md items-start gap-2 rounded-lg border border-orange-400/20 bg-orange-500/5 p-3 text-left">
          <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-orange-400" />
          <p className="text-xs leading-relaxed text-slate-300">
            <span className="font-medium text-white">Tip:</span> Staff can log hours from the{" "}
            <span className="text-orange-300">Active Jobs</span> page or from their Team Management
            screen. Entries appear here in real time.
          </p>
        </div>
      )}
    </div>
  );
}
