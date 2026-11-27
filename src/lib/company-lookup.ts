export interface CompanyDetails {
  id: string;
  name: string;
  address: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state: string;
  countryCode: string;
  email: string;
  phone: string;
}

function text(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function parseCompanies(payload: unknown): CompanyDetails[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((value: unknown) => {
    const row = record(value);
    // Exclude administrative boundaries and streets with matching names.
    if (!["office", "shop", "craft", "amenity", "building", "industrial", "landuse", "tourism"].includes(text(row, "category"))) return [];
    const name = text(row, "name");
    if (!name) return [];
    const address = record(row["address"]);
    const tags = record(row["extratags"]);
    return [{
      id: `${text(row, "osm_type")}-${String(row["osm_id"] ?? row["place_id"])}`,
      name,
      address: text(row, "display_name"),
      street: text(address, "road", "pedestrian", "street"),
      houseNumber: text(address, "house_number"),
      postalCode: text(address, "postcode"),
      city: text(address, "city", "town", "village", "municipality"),
      state: text(address, "state"),
      countryCode: text(address, "country_code").toUpperCase(),
      email: text(tags, "contact:email", "email"),
      phone: text(tags, "contact:phone", "phone"),
    }];
  });
}

let lastRequest = 0;

// Explicit searches only: Nominatim does not permit keystroke autocomplete.
export async function searchCompanies(query: string, countryCode: string, signal: AbortSignal) {
  const wait = Math.max(0, 1100 - (Date.now() - lastRequest));
  lastRequest = Date.now() + wait;
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  signal.throwIfAborted();
  const params = new URLSearchParams({ q: query.trim(), format: "jsonv2", addressdetails: "1", extratags: "1", limit: "8", countrycodes: countryCode.toLowerCase() });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!response.ok) throw new Error("Company search is unavailable. Please enter your details manually.");
  return parseCompanies(await response.json());
}