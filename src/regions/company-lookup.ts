/**
 * Company / business autocomplete lookup.
 *
 * Defaults to Germany (countrycode=de), but designed to accept any country code
 * to easily support international expansion across all implemented languages.
 *
 * Uses Photon (OpenStreetMap data) for fast, free, real-time business discovery
 * without requiring upfront paid API keys.
 */

export type CompanySuggestion = {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  category: string;
  fullAddress: string;
};

export type CompanyLookupOptions = {
  /** ISO 3166-1 alpha-2 country code (default 'de'). */
  countryCode?: string;
  /** Max results to return (default 8). */
  limit?: number;
  signal?: AbortSignal;
};

const CACHE = new Map<string, CompanySuggestion[]>();

/**
 * Fetch business suggestions matching a query string.
 */
export async function fetchCompanySuggestions(
  query: string,
  options: CompanyLookupOptions = {},
): Promise<CompanySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const countryCode = (options.countryCode || "de").toLowerCase();
  const limit = options.limit ?? 8;
  const cacheKey = `${countryCode}:${trimmed.toLowerCase()}`;

  const cached = CACHE.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: trimmed,
    countrycode: countryCode,
    limit: String(limit * 2), // Fetch extra so filtering doesn't leave an empty list
  });

  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      signal: options.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      features?: Array<{
        properties?: Record<string, string | number | undefined>;
      }>;
    };

    const suggestions: CompanySuggestion[] = [];
    const seen = new Set<string>();

    for (const feature of data.features ?? []) {
      const p = feature.properties ?? {};
      const name = typeof p.name === "string" ? p.name.trim() : "";
      if (!name) continue;

      const osmKey = String(p.osm_key ?? "");
      const osmVal = String(p.osm_value ?? "");

      // Exclude generic non-business geographical entities
      if (
        ["place", "railway", "highway", "boundary", "waterway", "natural"].includes(osmKey) &&
        !["building", "craft", "office", "shop", "commercial", "industrial"].includes(osmVal)
      ) {
        continue;
      }

      const street = typeof p.street === "string" ? p.street.trim() : "";
      const houseNumber = typeof p.housenumber === "string" ? p.housenumber.trim() : "";
      const postcode = typeof p.postcode === "string" ? p.postcode.trim() : "";
      const city =
        typeof p.city === "string"
          ? p.city.trim()
          : typeof p.town === "string"
            ? p.town.trim()
            : typeof p.village === "string"
              ? p.village.trim()
              : typeof p.district === "string"
                ? p.district.trim()
                : "";
      const state = typeof p.state === "string" ? p.state.trim() : "";
      const country = typeof p.country === "string" ? p.country.trim() : "";

      // Deduplicate identical business name + city + street
      const dedupeKey = `${name.toLowerCase()}|${city.toLowerCase()}|${street.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      // Human-readable category label
      let category = "";
      if (osmVal && osmVal !== "yes") {
        category = osmVal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (osmKey) {
        category = osmKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const addrParts: string[] = [];
      if (street) {
        addrParts.push(`${street} ${houseNumber}`.trim());
      }
      if (postcode || city) {
        addrParts.push(`${postcode} ${city}`.trim());
      }
      if (state && state !== city) {
        addrParts.push(state);
      }
      const fullAddress = addrParts.join(", ");

      suggestions.push({
        id: String(p.osm_id ?? `${Math.random().toString(36).slice(2)}`),
        name,
        street,
        houseNumber,
        postcode,
        city,
        state,
        country,
        category,
        fullAddress,
      });

      if (suggestions.length >= limit) break;
    }

    CACHE.set(cacheKey, suggestions);
    return suggestions;
  } catch {
    return [];
  }
}
