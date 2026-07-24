/**
 * Help Requests — local store for tradesperson collaboration posts.
 *
 * A "help request" is a tradesperson-posted job aimed at other self-employed
 * trades: backup on a job, partner needed, equipment sharing, etc. Persisted
 * to localStorage for the demo/preview flow; a real backend can replace the
 * store surface without touching the UI.
 */

export type HelpRequestKind = "backup" | "partner" | "equipment" | "other";

export interface HelpRequest {
  id: string;
  title: string;
  kind: HelpRequestKind;
  trade: string;
  city: string;
  startDate?: string;
  durationDays?: number;
  description: string;
  contactName: string;
  contactPhone?: string;
  createdAt: string;
}

const KEY = "hw:help_requests";
const EVENT = "hw:help_requests_update";

export const HELP_REQUEST_EVENT = EVENT;

export function listHelpRequests(): HelpRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HelpRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHelpRequest(input: Omit<HelpRequest, "id" | "createdAt">): HelpRequest {
  const next: HelpRequest = {
    ...input,
    id: `hr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const all = [next, ...listHelpRequests()];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(all));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function subscribeHelpRequests(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export const HELP_REQUEST_KINDS: { value: HelpRequestKind; label: string }[] = [
  { value: "backup", label: "Backup for a job" },
  { value: "partner", label: "Partner needed" },
  { value: "equipment", label: "Equipment sharing" },
  { value: "other", label: "Other" },
];
