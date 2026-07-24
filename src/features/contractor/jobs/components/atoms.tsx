import { Flame } from "lucide-react";
import type { Derived } from "./active-jobs-store";

export function SummaryCard({
  label,
  value,
  icon,
  accent = "text-white",
  alert = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm backdrop-blur-sm ${
        alert ? "border-rose-400/40 bg-rose-500/[0.08]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <p className={`mt-1 font-display text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export function UrgencyDot({ urgency }: { urgency: Derived["urgency"] }) {
  if (urgency === "high")
    return (
      <span
        title="High urgency"
        className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-200"
      >
        <Flame className="size-3" />
        Urgent
      </span>
    );
  if (urgency === "normal")
    return (
      <span
        title="Normal urgency"
        className="inline-flex size-2 rounded-full bg-orange-glow"
        aria-label="normal urgency"
      />
    );
  return (
    <span
      title="Low urgency"
      className="inline-flex size-2 rounded-full bg-slate-500"
      aria-label="low urgency"
    />
  );
}

export function QuickBtn({
  onClick,
  icon,
  label,
  primary = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        primary
          ? "bg-orange text-slate-900 hover:bg-orange-glow"
          : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ActionBtn({
  onClick,
  icon,
  label,
  primary = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
        primary
          ? "bg-orange text-slate-900 hover:bg-orange-glow"
          : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function InfoTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <dt className="text-[10px] uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`mt-1 font-semibold ${tone ?? "text-white"}`}>{value}</dd>
    </div>
  );
}
