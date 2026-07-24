import type { Hammer } from "lucide-react";

export type Lead = {
  id: string;
  title: string;
  location: string;
  postedAgo: string;
  budgetEur: number;
  snippet: string;
  details: string;
  Icon: typeof Hammer;
  iconTone: string;
  trade?: string;
  distanceKm?: number;
};

export type PillId = "trade" | "distance" | "budget";
export type Prefs = { trade: string; distanceKm: number; budgetEur: number };

export const ALL_TRADES = "All trades";
export const TRADE_OPTIONS = [
  ALL_TRADES,
  "Roofing & Waterproofing",
  "Plumbing & Heating",
  "Electrical",
  "Painting & Decorating",
  "Carpentry",
  "Tiling & Stone",
  "Landscaping",
];

export const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];
export const BUDGET_OPTIONS = [500, 1000, 2500, 5000, 10000];

export const PILL_EMOJI: Record<PillId, string> = {
  trade: "🛠️",
  distance: "📍",
  budget: "💶",
};

export function formatPillLabel(id: PillId, prefs: Prefs): string {
  if (id === "trade") return prefs.trade;
  if (id === "distance") return `Within ${prefs.distanceKm} km`;
  return `From €${prefs.budgetEur.toLocaleString("de-DE")}+`;
}
