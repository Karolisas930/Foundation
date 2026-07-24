/**
 * OpenPLZ API client — async German postal-code + street lookup.
 *
 * Docs: https://www.openplzapi.org
 *   - Localities: GET /de/Localities?postalCode=68159
 *       → [{ postalCode, name, federalState: { name }, ... }]
 *   - Streets:    GET /de/Streets?postalCode=68159&name=Haupt
 *       → [{ name, postalCode, locality, federalState: { name }, ... }]
 *
 * All calls fail soft: on network error / non-200 we return null / [] so
 * callers can gracefully fall back to manual text entry.
 */
import type { StreetSuggestion } from "./streets-de";

const BASE = "https://openplzapi.org/de";

type OpenPlzLocality = {
  postalCode?: string;
  name?: string;
  federalState?: { name?: string } | null;
};

type OpenPlzStreet = {
  name?: string;
  postalCode?: string;
  locality?: string;
  federalState?: { name?: string } | null;
};

export type PostcodeHit = {
  city: string;
  state: string;
  postcode: string;
};

const LOCALITY_CACHE = new Map<string, PostcodeHit | null>();
const STREET_CACHE = new Map<string, StreetSuggestion[]>();

export async function lookupPostalCodeOpenPLZ(
  postalCode: string,
  opts: { signal?: AbortSignal } = {},
): Promise<PostcodeHit | null> {
  const plz = postalCode.trim();
  if (!/^\d{5}$/.test(plz)) return null;
  if (LOCALITY_CACHE.has(plz)) return LOCALITY_CACHE.get(plz) ?? null;

  try {
    const res = await fetch(`${BASE}/Localities?postalCode=${plz}`, {
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as OpenPlzLocality[];
    const first = Array.isArray(rows) ? rows[0] : undefined;
    if (!first?.name) {
      LOCALITY_CACHE.set(plz, null);
      return null;
    }
    const hit: PostcodeHit = {
      city: first.name,
      state: first.federalState?.name ?? "",
      postcode: first.postalCode ?? plz,
    };
    LOCALITY_CACHE.set(plz, hit);
    return hit;
  } catch {
    return null;
  }
}

export async function fetchStreetsOpenPLZ(
  query: string,
  postalCode: string,
  opts: { signal?: AbortSignal; limit?: number } = {},
): Promise<StreetSuggestion[]> {
  const plz = postalCode.trim();
  const q = query.trim();
  if (!/^\d{5}$/.test(plz)) return [];
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(opts.limit ?? 8, 20));
  const key = `${plz}::${q.toLowerCase()}`;
  const cached = STREET_CACHE.get(key);
  if (cached) return cached.slice(0, limit);

  const params = new URLSearchParams({ postalCode: plz, name: q });
  try {
    const res = await fetch(`${BASE}/Streets?${params.toString()}`, {
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as OpenPlzStreet[];
    const seen = new Set<string>();
    const out: StreetSuggestion[] = [];
    for (const r of rows) {
      if (!r.name) continue;
      if (r.postalCode && r.postalCode !== plz) continue;
      const dedupe = r.name.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      out.push({
        name: r.name,
        city: r.locality ?? "",
        state: r.federalState?.name ?? "",
        postcode: r.postalCode ?? plz,
      });
      if (out.length >= limit) break;
    }
    STREET_CACHE.set(key, out);
    return out;
  } catch {
    return [];
  }
}
