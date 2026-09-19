/**
 * Derived data + local-only crew/hours notes for Active Jobs.
 *
 * Job data itself comes from Supabase via `@/lib/active-jobs.functions`.
 * Crew assignment and hour logs are still device-local helpers.
 */
import { useMemo, useSyncExternalStore } from "react";
import type { ActiveJob } from "@/lib/active-jobs.functions";

export type FilterKey = "today" | "week" | "all" | "overdue";
export type SortKey = "date" | "progress" | "client" | "urgency";

export const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "all", label: "All Active" },
  { id: "overdue", label: "Overdue" },
];

export const STAFF_POOL = ["Ali K.", "Marek P.", "Sabine R.", "Jonas B.", "Erik L."];
export const TIME_SLOTS = ["07:30", "08:00", "09:15", "10:00", "13:00", "14:30"];

const CREW_KEY = "hw:job-crew::v1";
const HOURS_KEY = "hw:job-hours::v1";

export type HoursLog = {
  id: string;
  jobId: string;
  staff: string;
  hours: number;
  date: string;
  note?: string;
  createdAt: number;
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = () => l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function readCrewMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CREW_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeCrewMap(m: Record<string, string[]>) {
  window.localStorage.setItem(CREW_KEY, JSON.stringify(m));
  emit();
}
function readHours(): HoursLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HOURS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeHours(list: HoursLog[]) {
  window.localStorage.setItem(HOURS_KEY, JSON.stringify(list));
  emit();
}

export function useCrewOverride(jobId: string | null): string[] | null {
  const snap = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(CREW_KEY) ?? "{}",
    () => "{}",
  );
  return useMemo(() => {
    if (!jobId) return null;
    try {
      const m = JSON.parse(snap) as Record<string, string[]>;
      return m[jobId] ?? null;
    } catch {
      return null;
    }
  }, [snap, jobId]);
}

export function useHoursForJob(jobId: string | null): HoursLog[] {
  const snap = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(HOURS_KEY) ?? "[]",
    () => "[]",
  );
  return useMemo(() => {
    if (!jobId) return [];
    try {
      return (JSON.parse(snap) as HoursLog[]).filter((h) => h.jobId === jobId);
    } catch {
      return [];
    }
  }, [snap, jobId]);
}

export function addCrewMember(jobId: string, name: string, defaultCrew: string[]) {
  const map = readCrewMap();
  const current = map[jobId] ?? defaultCrew;
  const n = name.trim();
  if (!n) return;
  if (current.some((c) => c.toLowerCase() === n.toLowerCase())) return;
  map[jobId] = [...current, n];
  writeCrewMap(map);
}
export function removeCrewMember(jobId: string, name: string, defaultCrew: string[]) {
  const map = readCrewMap();
  const current = map[jobId] ?? defaultCrew;
  map[jobId] = current.filter((c) => c !== name);
  writeCrewMap(map);
}

export function logHours(entry: Omit<HoursLog, "id" | "createdAt">) {
  const list = readHours();
  list.unshift({
    ...entry,
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  });
  writeHours(list);
}

export function sumHoursForJob(jobId: string): number {
  return readHours()
    .filter((h) => h.jobId === jobId)
    .reduce((s, h) => s + h.hours, 0);
}

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
export function derive(job: ActiveJob): Derived {
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
  const override = readCrewMap()[job.bookingId];
  const staff = override ?? defaultStaff;

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
