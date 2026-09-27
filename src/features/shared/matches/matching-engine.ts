/**
 * Core Matching Filter Engine.
 *
 * Pillar 2 of the architecture: a single, testable classifier that decides
 * whether a homeowner lead should surface in the contractor feed, and
 * scores each candidate 0–100 %.
 *
 * Weighted score (total 100):
 *   • Budget vs. Min Project Size .................... 30
 *   • Distance vs. Service Radius .................... 30
 *   • Trade / sector match ........................... 25
 *   • Language overlap ............................... 15
 *
 * Hard filters (a lead below either MUST NOT reach the contractor feed):
 *   • budget < minProjectSize   → routed silently to /notifications
 *   • distance > serviceRadius  → routed silently to /notifications
 *
 * Pure module — no I/O, no globals. Safe to run in loaders, server
 * functions, or components.
 */
import { distanceBetweenPostcodes } from "@/regions";
import { toTradeCode, toTradeKeys } from "@/regions/trade-codes";

/** Contractor-side inputs the classifier needs. */
export interface MatchingProfile {
  /** Minimum project value (EUR) the contractor accepts. */
  minProjectSize?: number | null;
  /** Service radius in km around the contractor's postal code. */
  serviceRadiusKm?: number | null;
  /** Contractor's home base postal code (DE 5-digit). */
  postalCode?: string | null;
  /** Trades the contractor performs, e.g. ["Plumbing","Electrical"]. */
  trades?: readonly string[] | null;
  /** Spoken languages, e.g. ["de","en","tr"]. */
  languages?: readonly string[] | null;
}

/** Homeowner-side inputs the classifier needs. */
export interface MatchableLead {
  id: string;
  /** Homeowner's estimated budget in EUR. */
  estimatedBudget: number;
  /** Trade tag on the project (e.g. "Plumbing"). Optional. */
  trade?: string | null;
  /** Job location postal code (DE 5-digit). Optional. */
  locationZip?: string | null;
  /** Language string on the project (any of "de", "🇩🇪 Deutsch · 🇬🇧 English", …). */
  language?: string | null;
}

export type LeadTier = "priority" | "alert";

export interface MatchScoreBreakdown {
  /** 0–100 overall match percentage. */
  percent: number;
  budget: number; // 0–30
  distance: number; // 0–30
  trade: number; // 0–25
  language: number; // 0–15
  /** Distance in km, or null when postal codes are unavailable. */
  distanceKm: number | null;
  /** Human reasons — useful for tooltips. */
  reasons: string[];
}

export interface LeadClassification {
  leadId: string;
  tier: LeadTier;
  /** True when the lead MUST NOT trigger push / badge / sound. */
  silent: boolean;
  /** Positive = headroom, negative = shortfall (EUR). */
  delta: number;
  /** Threshold that was applied. */
  appliedThreshold: number;
  /** Rich score for the feed UI. */
  score: MatchScoreBreakdown;
  reason: string;
}

export const DEFAULT_MIN_PROJECT_SIZE = 0;
export const DEFAULT_SERVICE_RADIUS_KM = 30;

const BUDGET_MAX = 30;
const DISTANCE_MAX = 30;
const TRADE_MAX = 25;
const LANGUAGE_MAX = 15;

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
}

function normalizeList(v: readonly string[] | null | undefined): string[] {
  if (!v) return [];
  return v.map((s) => (typeof s === "string" ? s.trim().toLowerCase() : "")).filter(Boolean);
}

/** Extract 2-letter language codes from a free-form language string. */
function extractLanguageCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const codes = new Set<string>();
  const map: Array<[RegExp, string]> = [
    [/\bdeutsch|german|de\b/, "de"],
    [/\benglish|englisch|en\b/, "en"],
    [/\bturkish|türk|tr\b/, "tr"],
    [/\bpolish|polnisch|pl\b/, "pl"],
    [/\bfrench|français|fr\b/, "fr"],
    [/\bitalian|italienisch|it\b/, "it"],
    [/\bspanish|español|es\b/, "es"],
    [/\barabic|ar\b/, "ar"],
    [/\btagalog|filipino|tl\b/, "tl"],
    [/\bromanian|ro\b/, "ro"],
    [/\brussian|ru\b/, "ru"],
  ];
  for (const [rx, code] of map) if (rx.test(lower)) codes.add(code);
  return [...codes];
}

/**
 * Compute the 0–100 match percentage + subscore breakdown for one pair.
 * Pure and side-effect free.
 */
export function computeMatchScore(
  lead: MatchableLead,
  profile: MatchingProfile,
): MatchScoreBreakdown {
  const reasons: string[] = [];
  const mps = num(profile.minProjectSize, DEFAULT_MIN_PROJECT_SIZE);
  const radius = num(profile.serviceRadiusKm, DEFAULT_SERVICE_RADIUS_KM);
  const budget = num(lead.estimatedBudget, 0);

  // Budget score — full marks at ≥2× MPS, linear below.
  let budgetScore: number;
  if (mps <= 0) {
    budgetScore = BUDGET_MAX;
  } else if (budget >= mps * 2) {
    budgetScore = BUDGET_MAX;
    reasons.push(`Budget €${budget.toLocaleString("de-DE")} well above threshold.`);
  } else if (budget >= mps) {
    budgetScore = Math.round(BUDGET_MAX * (0.6 + 0.4 * ((budget - mps) / mps)));
    reasons.push(`Budget clears €${mps.toLocaleString("de-DE")} threshold.`);
  } else {
    budgetScore = Math.round(BUDGET_MAX * 0.3 * (budget / Math.max(mps, 1)));
    reasons.push(`Budget below €${mps.toLocaleString("de-DE")} minimum.`);
  }

  // Distance score — full at 0 km, zero at radius; unknown treated as neutral.
  const distanceKm =
    profile.postalCode && lead.locationZip
      ? distanceBetweenPostcodes(profile.postalCode, lead.locationZip)
      : null;

  let distanceScore: number;
  if (distanceKm === null) {
    distanceScore = Math.round(DISTANCE_MAX * 0.6);
  } else if (radius <= 0 || distanceKm <= 0) {
    distanceScore = DISTANCE_MAX;
  } else if (distanceKm <= radius) {
    distanceScore = Math.round(DISTANCE_MAX * (1 - distanceKm / radius));
    reasons.push(`~${Math.round(distanceKm)} km away (within ${radius} km).`);
  } else {
    distanceScore = 0;
    reasons.push(`~${Math.round(distanceKm)} km — outside ${radius} km radius.`);
  }

  // Trade score — compares canonical trade codes (language-independent);
  // unmapped legacy text falls back to case-insensitive text comparison.
  const trades = toTradeKeys(profile.trades);
  const leadTrade = lead.trade ? (toTradeCode(lead.trade) ?? lead.trade.trim().toLowerCase()) : "";
  let tradeScore = 0;
  if (trades.length === 0) {
    tradeScore = Math.round(TRADE_MAX * 0.5);
  } else if (leadTrade && trades.includes(leadTrade)) {
    tradeScore = TRADE_MAX;
    reasons.push(`Trade match: ${lead.trade}.`);
  } else if (!leadTrade) {
    tradeScore = Math.round(TRADE_MAX * 0.3);
  } else {
    tradeScore = 0;
    reasons.push(`Trade "${lead.trade}" not in your list.`);
  }

  // Language score — any overlap → full marks; neutral when unknown.
  const contractorLangs = normalizeList(profile.languages);
  const jobLangs = extractLanguageCodes(lead.language);
  let languageScore: number;
  if (contractorLangs.length === 0 || jobLangs.length === 0) {
    languageScore = Math.round(LANGUAGE_MAX * 0.6);
  } else if (jobLangs.some((l) => contractorLangs.includes(l))) {
    languageScore = LANGUAGE_MAX;
    reasons.push("Language match.");
  } else {
    languageScore = 0;
    reasons.push("No language overlap.");
  }

  const percent = Math.max(
    0,
    Math.min(100, budgetScore + distanceScore + tradeScore + languageScore),
  );

  return {
    percent,
    budget: budgetScore,
    distance: distanceScore,
    trade: tradeScore,
    language: languageScore,
    distanceKm,
    reasons,
  };
}

/** Classify a single lead against a contractor's profile. */
export function classifyLead(lead: MatchableLead, profile: MatchingProfile): LeadClassification {
  const threshold = num(profile.minProjectSize, DEFAULT_MIN_PROJECT_SIZE);
  const radius = num(profile.serviceRadiusKm, DEFAULT_SERVICE_RADIUS_KM);
  const budget = num(lead.estimatedBudget, 0);
  const score = computeMatchScore(lead, profile);
  const delta = budget - threshold;

  const budgetOk = delta >= 0;
  const radiusOk = score.distanceKm === null || score.distanceKm <= radius;
  const isPriority = budgetOk && radiusOk;

  return {
    leadId: lead.id,
    tier: isPriority ? "priority" : "alert",
    silent: !isPriority,
    delta,
    appliedThreshold: threshold,
    score,
    reason: isPriority
      ? `${score.percent}% match — budget €${budget.toLocaleString("de-DE")} clears €${threshold.toLocaleString("de-DE")}.`
      : !budgetOk
        ? `Budget €${budget.toLocaleString("de-DE")} below €${threshold.toLocaleString("de-DE")}; silent alert.`
        : `Out of ${radius} km radius; silent alert.`,
  };
}

export interface PartitionedLeads<T extends MatchableLead> {
  priority: Array<T & { classification: LeadClassification }>;
  alerts: Array<T & { classification: LeadClassification }>;
  appliedThreshold: number;
  appliedRadiusKm: number;
}

/** Partition + score a batch of leads in one pass. */
export function partitionLeads<T extends MatchableLead>(
  leads: readonly T[],
  profile: MatchingProfile,
): PartitionedLeads<T> {
  const threshold = num(profile.minProjectSize, DEFAULT_MIN_PROJECT_SIZE);
  const radius = num(profile.serviceRadiusKm, DEFAULT_SERVICE_RADIUS_KM);
  const priority: Array<T & { classification: LeadClassification }> = [];
  const alerts: Array<T & { classification: LeadClassification }> = [];

  for (const lead of leads) {
    const classification = classifyLead(lead, profile);
    const enriched = { ...lead, classification };
    if (classification.tier === "priority") priority.push(enriched);
    else alerts.push(enriched);
  }

  // Sort priority feed by best match first.
  priority.sort((a, b) => b.classification.score.percent - a.classification.score.percent);

  return {
    priority,
    alerts,
    appliedThreshold: threshold,
    appliedRadiusKm: radius,
  };
}

/** Downstream push/badge code MUST call this before emitting attention. */
export function isAttentionAllowed(classification: LeadClassification): boolean {
  return classification.tier === "priority" && !classification.silent;
}
