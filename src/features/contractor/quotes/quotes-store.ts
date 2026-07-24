/**
 * Quotes — local-first store for tradesperson quotes/estimates.
 * Mirrors the pattern used by site-diary-store: localStorage snapshot
 * exposed via useSyncExternalStore. Ready to swap for a Supabase table
 * later without changing the UI API.
 */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "hw:quotes::v1";

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "converted";

export type QuoteLineItem = {
  id: string;
  service: string;
  quantity: number;
  unitPrice: number; // EUR
};

export type Quote = {
  id: string;
  number: string; // human-readable, e.g. Q-20260711-A1B2
  clientName: string;
  clientEmail?: string;
  jobTitle: string;
  description?: string;
  items: QuoteLineItem[];
  validDays: number;
  notes?: string;
  status: QuoteStatus;
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  acceptedAt?: number;
  declinedAt?: number;
  convertedAt?: number;
  convertedTo?: "job" | "invoice";
  convertedRefId?: string;
};

const listeners = new Set<() => void>();
let cache: Quote[] = [];
let loaded = false;
const EMPTY: Quote[] = [];

function load(): Quote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Quote[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function read(): Quote[] {
  if (!loaded) {
    cache = load();
    loaded = true;
  }
  return cache;
}

function write(next: Quote[]) {
  cache = next;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useQuotes(): Quote[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function quoteTotal(q: Pick<Quote, "items">): number {
  return q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

function makeNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${stamp}-${rand}`;
}

export function addQuote(
  input: Omit<Quote, "id" | "createdAt" | "updatedAt" | "number" | "status"> & {
    status?: QuoteStatus;
    number?: string;
  },
): Quote {
  const now = Date.now();
  const q: Quote = {
    id: `q_${now}_${Math.random().toString(36).slice(2, 8)}`,
    number: input.number ?? makeNumber(),
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  write([q, ...read()]);
  return q;
}

export function updateQuote(id: string, patch: Partial<Quote>) {
  const next = read().map((q) => (q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q));
  write(next);
}

export function removeQuote(id: string) {
  write(read().filter((q) => q.id !== id));
}

export function setQuoteStatus(id: string, status: QuoteStatus) {
  const now = Date.now();
  const patch: Partial<Quote> = { status };
  if (status === "sent") patch.sentAt = now;
  if (status === "accepted") patch.acceptedAt = now;
  if (status === "declined") patch.declinedAt = now;
  updateQuote(id, patch);
}

export function newLineItem(): QuoteLineItem {
  return {
    id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    service: "",
    quantity: 1,
    unitPrice: 0,
  };
}
