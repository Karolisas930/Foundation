/**
 * Small presentational primitives shared across TaxTools subcomponents.
 */
import { CalendarDays, Landmark, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-orange bg-orange/15 text-orange"
          : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white/90",
      )}
    >
      {children}
    </button>
  );
}

export function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Landmark;
  children: React.ReactNode;
}) {
  return (
    <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
      <Icon className="size-3.5 text-orange" strokeWidth={1.5} /> {children}
    </h4>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "text-white",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className={cn("font-display mt-1 text-lg font-bold", accent)}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-white/45">{hint}</p>}
    </div>
  );
}

export function HeroKpi({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "pos" | "neg" | "warn";
  icon: typeof Landmark;
}) {
  const toneCls =
    tone === "pos" ? "text-emerald-300" : tone === "warn" ? "text-orange" : "text-sky-300";
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">{label}</p>
        <Icon className={cn("size-3.5", toneCls)} strokeWidth={1.75} />
      </div>
      <p className={cn("font-display mt-1 text-xl font-extrabold", toneCls)}>{value}</p>
      <p className="mt-0.5 text-[10px] text-white/45">{hint}</p>
    </div>
  );
}

export function InsightCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: typeof Landmark;
  tone: "pos" | "warn" | "info";
  title: string;
  body: string;
}) {
  const cls =
    tone === "pos"
      ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200"
      : tone === "warn"
        ? "border-orange/30 bg-orange/[0.08] text-orange"
        : "border-sky-400/25 bg-sky-400/[0.06] text-sky-200";
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3", cls)}>
      <div className="mt-0.5">
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/60">{body}</p>
      </div>
    </div>
  );
}

export function DeadlineRow({
  title,
  date,
  daysAway,
  kind,
}: {
  title: string;
  date: Date;
  daysAway: number;
  kind: "vat" | "income";
}) {
  const urgency =
    daysAway < 0 ? "past" : daysAway <= 7 ? "critical" : daysAway <= 30 ? "soon" : "ok";
  const dotCls =
    urgency === "critical"
      ? "bg-red-400"
      : urgency === "soon"
        ? "bg-orange"
        : urgency === "past"
          ? "bg-white/25"
          : "bg-emerald-400";
  const badgeCls =
    urgency === "critical"
      ? "border-red-400/40 bg-red-400/15 text-red-300"
      : urgency === "soon"
        ? "border-orange/40 bg-orange/15 text-orange"
        : urgency === "past"
          ? "border-white/15 bg-white/5 text-white/50"
          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  const progress =
    urgency === "past"
      ? 100
      : Math.max(4, Math.min(100, ((90 - Math.min(90, daysAway)) / 90) * 100));

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <span className={cn("size-2 flex-shrink-0 rounded-full", dotCls)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90">{title}</p>
          <p className="flex items-center gap-1 text-[11px] text-white/50">
            <CalendarDays className="size-3" strokeWidth={1.5} />
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            <span className="text-white/30">·</span>
            <span className="uppercase tracking-wider">
              {kind === "vat" ? "VAT" : "Income tax"}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            badgeCls,
          )}
        >
          {daysAway < 0
            ? `${Math.abs(daysAway)}d ago`
            : daysAway === 0
              ? "Today"
              : `in ${daysAway}d`}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            urgency === "critical"
              ? "bg-red-400"
              : urgency === "soon"
                ? "bg-orange"
                : urgency === "past"
                  ? "bg-white/20"
                  : "bg-emerald-400/70",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </li>
  );
}

export function EmptyChart() {
  return (
    <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-xs text-white/45">
      <TrendingUp className="size-6 text-white/25" strokeWidth={1.5} />
      No revenue or expenses in this period yet.
    </div>
  );
}
