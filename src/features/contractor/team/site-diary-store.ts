/**
 * Site Diary — local-first store for on-site job artifacts.
 *
 * All entries are kept in localStorage as base64 data URLs. This mirrors the
 * demo-mode pattern used by invoice-store / receipts-store elsewhere in the
 * app: no backend round-trip required, but the shape is ready to sync to
 * Supabase Storage + a `site_diary_entries` table later.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { getEcosystemLedger } from "@/core/demo-session";

const STORAGE_KEY = "site-diary::entries::v1";
const ACTIVE_JOB_KEY = "site-diary::active-job::v1";

export type SiteDiaryKind =
  | "photo-before"
  | "photo-after"
  | "receipt"
  | "voice"
  | "signature"
  | "note";

export type SiteDiaryEntry = {
  id: string;
  jobId: string;
  jobTitle: string;
  kind: SiteDiaryKind;
  /** Base64 data URL for images/audio, empty for pure notes. */
  dataUrl?: string;
  /** Freeform note or transcript. */
  note?: string;
  /** Customer name captured with a signature. */
  signerName?: string;
  /** Original filename when relevant (receipts). */
  filename?: string;
  /** Duration in seconds for voice notes. */
  durationSec?: number;
  createdAt: number;
};

/* --------------------------------- store --------------------------------- */

const listeners = new Set<() => void>();
let cachedSnapshot: SiteDiaryEntry[] = [];
let snapshotLoaded = false;
const EMPTY: SiteDiaryEntry[] = [];

function loadFromStorage(): SiteDiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SiteDiaryEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readAll(): SiteDiaryEntry[] {
  if (!snapshotLoaded) {
    cachedSnapshot = loadFromStorage();
    snapshotLoaded = true;
  }
  return cachedSnapshot;
}

function writeAll(next: SiteDiaryEntry[]) {
  cachedSnapshot = next;
  snapshotLoaded = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSiteDiaryEntries(jobId?: string): SiteDiaryEntry[] {
  const all = useSyncExternalStore(subscribe, readAll, () => EMPTY);
  return jobId ? all.filter((e) => e.jobId === jobId) : all;
}

export function addSiteDiaryEntry(entry: Omit<SiteDiaryEntry, "id" | "createdAt">): SiteDiaryEntry {
  const full: SiteDiaryEntry = {
    ...entry,
    id: `sd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [full, ...readAll()];
  writeAll(next);
  return full;
}

export function removeSiteDiaryEntry(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}

/**
 * Move an entry earlier (dir=-1) or later (dir=+1) within its own kind,
 * scoped to the same job. Used by Photos reordering controls.
 */
export function moveSiteDiaryEntry(id: string, dir: -1 | 1) {
  const all = readAll();
  const target = all.find((e) => e.id === id);
  if (!target) return;
  // Build a same-kind, same-job sibling list preserving current order.
  const siblings = all.filter((e) => e.kind === target.kind && e.jobId === target.jobId);
  const idx = siblings.findIndex((e) => e.id === id);
  const swap = idx + dir;
  if (idx < 0 || swap < 0 || swap >= siblings.length) return;
  const swapId = siblings[swap].id;
  // Swap position in the global list.
  const next = all.slice();
  const i1 = next.findIndex((e) => e.id === id);
  const i2 = next.findIndex((e) => e.id === swapId);
  [next[i1], next[i2]] = [next[i2], next[i1]];
  writeAll(next);
}

export const SITE_DIARY_PHOTO_LIMIT = 30;

/* --------------------------------- jobs ---------------------------------- */

export type SiteDiaryJob = {
  id: string;
  title: string;
  city?: string;
  phase?: string;
};

/** Combine the demo ledger (awarded projects) with any locally-created jobs. */
export function useSiteDiaryJobs(): SiteDiaryJob[] {
  const [local, setLocal] = useState<SiteDiaryJob[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("site-diary::jobs::v1");
      if (raw) setLocal(JSON.parse(raw) as SiteDiaryJob[]);
    } catch {
      /* noop */
    }
  }, []);
  const ledger = getEcosystemLedger();
  const fromLedger: SiteDiaryJob[] = ledger.projects
    .filter((p) => p.status === "awarded" || p.status === "clarifying")
    .map((p) => ({ id: p.id, title: p.title, city: p.city, phase: p.phase }));
  const seen = new Set(fromLedger.map((j) => j.id));
  return [...fromLedger, ...local.filter((j) => !seen.has(j.id))];
}

export function addLocalJob(title: string): SiteDiaryJob {
  const job: SiteDiaryJob = {
    id: `local_${Date.now()}`,
    title: title.trim() || "Untitled job",
  };
  const raw = window.localStorage.getItem("site-diary::jobs::v1");
  const existing: SiteDiaryJob[] = raw ? JSON.parse(raw) : [];
  const next = [job, ...existing];
  window.localStorage.setItem("site-diary::jobs::v1", JSON.stringify(next));
  listeners.forEach((l) => l());
  return job;
}

export function getActiveJobId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_JOB_KEY);
}

export function setActiveJobId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_JOB_KEY, id);
  else window.localStorage.removeItem(ACTIVE_JOB_KEY);
  listeners.forEach((l) => l());
}

/* -------------------------------- helpers -------------------------------- */

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
