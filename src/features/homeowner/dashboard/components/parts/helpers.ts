import type { EcosystemProject } from "@/core/demo-session";

export type TimeSlot = "morning" | "afternoon" | "evening";
export type SiteVisit = { dates: string[]; slot: TimeSlot };

export const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: "Morning · 8–12",
  afternoon: "Afternoon · 12–17",
  evening: "Evening · 17–20",
};

export const SITE_VISITS_KEY = "hw_site_visits_v2";

export const statusLabel: Record<EcosystemProject["status"], string> = {
  open: "Matching trades",
  clarifying: "Awaiting your reply",
  awarded: "Awarded · in progress",
  completed: "Completed",
};

/** Deterministic 78–98% match score from a bid id. */
export function getMatchScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 78 + (h % 21);
}

/** Safely parse an ISO date string. Returns null when invalid. */
export function safeParseISO(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 40) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function loadSiteVisits(): Record<string, SiteVisit> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SITE_VISITS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SiteVisit> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const obj = v as { dates?: unknown; slot?: unknown };
      const dates = Array.isArray(obj.dates)
        ? obj.dates
            .map((d) => safeParseISO(d))
            .filter((d): d is Date => d !== null)
            .slice(0, 7)
            .map((d) => d.toISOString())
        : [];
      const slot: TimeSlot =
        obj.slot === "morning" || obj.slot === "afternoon" || obj.slot === "evening"
          ? obj.slot
          : "morning";
      if (dates.length) out[k] = { dates, slot };
    }
    return out;
  } catch {
    return {};
  }
}
