/**
 * km-tax — utility calculations for the Kilometer Tax Tracker quick action.
 *
 * Distance is derived from the 5-digit German postcode centroids provided by
 * `src/lib/postcode-de.ts` (haversine, no external API). Deduction follows
 * the standard German Entfernungspauschale of €0,30/km applied to the
 * one-way distance times 2 (round trip to the job site), configurable via
 * the caller's `finanz_settings.km_rate_cents` value.
 */
import { distanceBetweenPostcodes } from "@/regions";

export const STANDARD_KM_RATE_CENTS = 30;

export function extractPostcode(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const m = addr.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

/**
 * Estimate one-way driving distance in kilometers between two German
 * addresses (or plain postcodes). Returns 0 when either side lacks a
 * recognizable 5-digit PLZ so callers can fall back to manual entry.
 */
export function estimateOneWayKm(base: string, dest: string): number {
  const a = extractPostcode(base);
  const b = extractPostcode(dest);
  if (!a || !b) return 0;
  const d = distanceBetweenPostcodes(a, b);
  if (!d || d <= 0) return 0;
  // Round to one decimal, floor at 1 km for any recognizable trip.
  return Math.max(1, Math.round(d * 10) / 10);
}

/**
 * Round-trip kilometers for a client site visit (drive there + back).
 */
export function roundTripKm(oneWayKm: number): number {
  return Math.round(oneWayKm * 2 * 10) / 10;
}

/**
 * Deduction in EUR = km * rate (cents) / 100.
 */
export function calcDeductionEUR(km: number, kmRateCents: number = STANDARD_KM_RATE_CENTS): number {
  return Math.round(km * kmRateCents) / 100;
}

export function formatEUR(n: number): string {
  return `€ ${n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
