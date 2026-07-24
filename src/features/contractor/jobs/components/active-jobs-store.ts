/**
 * Local storage + derived data for Active Jobs.
 * Extracted from ActiveJobsPage.tsx.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getEcosystemLedger,
  updateEcosystemLedger,
  type EcosystemProject,
} from "@/core/demo-session";

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
  urgency: "low" | "normal" | "high";
  staff: string[];
  defaultStaff: string[];
  phone: string;
};

export function derive(p: EcosystemProject): Derived {
  const h = hash(p.id);
  const offset = (h % 15) - 4;
  const scheduled = new Date();
  scheduled.setHours(0, 0, 0, 0);
  scheduled.setDate(scheduled.getDate() + offset);
  const slot = TIME_SLOTS[h % TIME_SLOTS.length];
  const [hh, mm] = slot.split(":").map(Number);
  scheduled.setHours(hh, mm, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromToday = Math.round((scheduled.getTime() - today.getTime()) / 86_400_000);

  const isOverdue = daysFromToday < 0 && p.status !== "completed";
  const isToday = daysFromToday === 0;

  const usedPct = p.budgetTotal > 0 ? p.budgetUsed / p.budgetTotal : 0;
  const urgency: Derived["urgency"] = isOverdue
    ? "high"
    : isToday || usedPct > 0.85
      ? "high"
      : daysFromToday <= 2
        ? "normal"
        : "low";

  const staffCount = h % 3;
  const defaultStaff = Array.from(
    { length: staffCount },
    (_, i) => STAFF_POOL[(h + i * 7) % STAFF_POOL.length],
  );
  const override = readCrewMap()[p.id];
  const staff = override ?? defaultStaff;

  const phoneNum = 1_500_000 + (h % 8_499_999);
  const phone = `+49 170 ${String(phoneNum).slice(0, 3)} ${String(phoneNum).slice(3)}`;

  const label = isOverdue
    ? `${Math.abs(daysFromToday)}d overdue · ${slot}`
    : isToday
      ? `Today · ${slot}`
      : daysFromToday === 1
        ? `Tomorrow · ${slot}`
        : daysFromToday <= 7
          ? scheduled.toLocaleDateString(undefined, { weekday: "short" }) + ` · ${slot}`
          : scheduled.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) +
            ` · ${slot}`;

  return {
    scheduledAt: scheduled,
    scheduledLabel: label,
    daysFromToday,
    isToday,
    isOverdue,
    urgency,
    staff,
    defaultStaff,
    phone,
  };
}

export function progressOf(p: EcosystemProject): number {
  if (p.status === "completed") return 100;
  const pct =
    p.budgetTotal > 0 ? Math.min(100, Math.round((p.budgetUsed / p.budgetTotal) * 100)) : 0;
  if (p.status === "awarded") return Math.max(pct, 15);
  if (p.status === "clarifying") return Math.max(pct, 5);
  return pct;
}

export function statusMeta(p: EcosystemProject): { label: string; tone: string } {
  if (p.status === "completed")
    return { label: "Completed", tone: "bg-emerald-500/20 text-emerald-300" };
  if (p.status === "awarded")
    return { label: "In Progress", tone: "bg-orange/20 text-orange-glow" };
  if (p.status === "clarifying") return { label: "Clarifying", tone: "bg-sky-500/20 text-sky-300" };
  return { label: "Open", tone: "bg-white/10 text-slate-200" };
}

export function useLedgerTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((n) => n + 1);
    window.addEventListener("chameleon_ledger_update", h);
    const unsub = subscribe(h);
    return () => {
      window.removeEventListener("chameleon_ledger_update", h);
      unsub();
    };
  }, []);
}

export function setProjectStatus(id: string, status: EcosystemProject["status"]) {
  const ledger = getEcosystemLedger();
  ledger.projects = ledger.projects.map((p) => (p.id === id ? { ...p, status } : p));
  updateEcosystemLedger(ledger);
}

export function createProject(input: {
  title: string;
  city: string;
  zip: string;
  trade: string;
  budget: number;
}) {
  const ledger = getEcosystemLedger();
  const p: EcosystemProject = {
    id: `job_${Date.now()}`,
    title: input.title.trim(),
    description: "Added from Active Jobs.",
    locationZip: input.zip.trim() || "00000",
    city: input.city.trim(),
    phase: "Ausbau",
    status: "awarded",
    budgetTotal: input.budget,
    budgetUsed: 0,
    trade: input.trade.trim() || undefined,
  };
  ledger.projects = [p, ...ledger.projects];
  updateEcosystemLedger(ledger);
  return p;
}
