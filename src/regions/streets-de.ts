/**
 * Ultra-lightweight, postcode-scoped street lookup.
 *
 * - Zero bundled street arrays: suggestions come from OpenStreetMap /
 *   Nominatim (`https://nominatim.openstreetmap.org/search`).
 * - Results are STRICTLY filtered to the entered 5-digit German postal
 *   code, so `70176` only ever returns streets in Stuttgart-West and
 *   never a duplicate `Waldstraße` from Mannheim/Karlsruhe/etc.
 * - Small in-memory cache keeps repeated keystrokes free of network I/O.
 *
 * Callers debounce the query (see StreetAutocomplete, 300ms) so we never
 * hammer the endpoint while the user is still typing.
 */
export type StreetSuggestion = {
  /** Street name only, e.g. "Rotebühlstraße". */
  name: string;
  /** Resolved city / district, e.g. "Stuttgart". */
  city: string;
  /** German state (Bundesland), e.g. "Baden-Württemberg". */
  state: string;
  /** Confirmed 5-digit postal code, e.g. "70176". */
  postcode: string;
  /** Optional house number if Nominatim returned one. */
  houseNumber?: string;
  /** Latitude of the match (useful for the radius matcher). */
  lat?: number;
  /** Longitude of the match. */
  lon?: number;
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
  state?: string;
  country_code?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CACHE = new Map<string, StreetSuggestion[]>();
const MAX_CACHE_ENTRIES = 100;

function cacheKey(postcode: string, query: string) {
  return `${postcode}::${query.toLowerCase()}`;
}

function rememberCache(key: string, value: StreetSuggestion[]) {
  if (CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(key, value);
}

function pickStreetName(addr: NominatimAddress): string | null {
  return addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || null;
}

function pickCity(addr: NominatimAddress): string {
  return (
    addr.suburb ||
    addr.city_district ||
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    ""
  );
}

/**
 * Fetch up to `limit` street suggestions for `query`, strictly filtered to
 * the given 5-digit German `postalCode`. Returns `[]` when the postcode is
 * incomplete, the query is too short, or the request is aborted.
 */
export async function fetchStreetSuggestions(
  query: string,
  postalCode: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<StreetSuggestion[]> {
  const q = query.trim();
  const plz = postalCode.trim();

  // Guard: strict 5-digit German postcode required for scope-safe results.
  if (!/^\d{5}$/.test(plz)) return [];
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(opts.limit ?? 8, 20));
  const key = cacheKey(plz, q);
  const cached = CACHE.get(key);
  if (cached) return cached.slice(0, limit);

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: String(limit * 2), // over-fetch so we can drop cross-postcode noise
    countrycodes: "de",
    postalcode: plz,
    street: q,
    "accept-language": "de",
  });

  let raw: NominatimResult[] = [];
  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    raw = (await res.json()) as NominatimResult[];
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") return [];
    return [];
  }

  const seen = new Set<string>();
  const out: StreetSuggestion[] = [];

  for (const hit of raw) {
    const addr = hit.address;
    if (!addr) continue;
    if (addr.country_code && addr.country_code.toLowerCase() !== "de") continue;
    // STRICT postcode isolation — drop any row whose postcode isn't an exact match.
    if (!addr.postcode || addr.postcode.replace(/\s+/g, "") !== plz) continue;

    const street = pickStreetName(addr);
    if (!street) continue;

    const dedupe = street.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    out.push({
      name: street,
      city: pickCity(addr),
      state: addr.state ?? "",
      postcode: plz,
      houseNumber: addr.house_number,
      lat: hit.lat ? Number(hit.lat) : undefined,
      lon: hit.lon ? Number(hit.lon) : undefined,
    });

    if (out.length >= limit) break;
  }

  rememberCache(key, out);
  return out;
}
