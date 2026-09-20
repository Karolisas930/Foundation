/**
 * Derived presentation data for Active Jobs.
 *
 * All job data — including crew assignments and logged hours — comes from
 * Supabase (`@/lib/active-jobs.functions`, `@/lib/job-crew.functions`).
 * Nothing here touches browser storage.
 */
import type { ActiveJob } from "@/lib/active-jobs.functions";

export type FilterKey = "today" | "week" | "all" | "overdue";
export type SortKey = "date" | "progress" | "client" | "urgency";

export const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "all", label: "All Active" },
  { id: "overdue", label: "Overdue" },
];

export const TIME_SLOTS = ["07:30", "08:00", "09:15", "10:00", "13:00", "14:30"];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export type Derived = {
  scheduledAt: Date;
  scheduledLabel: string;
  daysFromToday: number;
  isToday: boolean;
  isOverdue: boolean;
  hasSchedule: boolean;
  urgency: "low" | "normal" | "high";
  staff: string[];
  defaultStaff: string[];
};

/** Schedule/urgency/crew info for one booking. */
export function derive(job: ActiveJob, crew: string[] = []): Derived {
  const h = hash(job.bookingId);
  const hasSchedule = Boolean(job.scheduledStart);

  let scheduled: Date;
  if (job.scheduledStart) {
    scheduled = new Date(job.scheduledStart);
  } else {
    // No date agreed yet — fall back to the booking date so sorting stays stable.
    scheduled = new Date(job.createdAt);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfScheduled = new Date(scheduled);
  startOfScheduled.setHours(0, 0, 0, 0);
  const daysFromToday = Math.round((startOfScheduled.getTime() - today.getTime()) / 86_400_000);

  const done = job.status === "completed" || job.status === "cancelled";
  const isOverdue = hasSchedule && daysFromToday < 0 && !done;
  const isToday = hasSchedule && daysFromToday === 0;

  const urgency: Derived["urgency"] = isOverdue
    ? "high"
    : isToday
      ? "high"
      : hasSchedule && daysFromToday <= 2
        ? "normal"
        : "low";

  const defaultStaff: string[] = [];
  const staff = crew;

  const time = scheduled.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const label = !hasSchedule
    ? "Not scheduled yet"
    : isOverdue
      ? `${Math.abs(daysFromToday)}d overdue · ${time}`
      : isToday
        ? `Today · ${time}`
        : daysFromToday === 1
          ? `Tomorrow · ${time}`
          : daysFromToday > 1 && daysFromToday <= 7
            ? `${scheduled.toLocaleDateString(undefined, { weekday: "short" })} · ${time}`
            : `${scheduled.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} · ${time}`;

  return {
    scheduledAt: scheduled,
    scheduledLabel: label,
    daysFromToday,
    isToday,
    isOverdue,
    hasSchedule,
    urgency,
    staff,
    defaultStaff,
  };
}

export function progressOf(job: ActiveJob): number {
  switch (job.status) {
    case "completed":
      return 100;
    case "in_progress":
      return 55;
    case "confirmed":
      return 20;
    case "cancelled":
      return 0;
    default:
      return 5;
  }
}

export function statusMeta(job: Pick<ActiveJob, "status">): { label: string; tone: string } {
  switch (job.status) {
    case "completed":
      return { label: "Completed", tone: "bg-emerald-500/20 text-emerald-300" };
    case "in_progress":
      return { label: "In Progress", tone: "bg-orange/20 text-orange-glow" };
    case "confirmed":
      return { label: "Confirmed", tone: "bg-sky-500/20 text-sky-300" };
    case "cancelled":
      return { label: "Cancelled", tone: "bg-rose-500/20 text-rose-200" };
    default:
      return { label: "Pending", tone: "bg-white/10 text-slate-200" };
  }
}

export function formatEuro(cents: number): string {
  return `€ ${(cents / 100).toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;
}
