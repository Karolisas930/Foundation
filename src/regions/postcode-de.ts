/**
 * Lightweight DE postcode → city/state lookup with extended Baden-Württemberg
 * coverage. Used to power auto-fill on onboarding forms and to provide
 * approximate centroids for radius-based job matching.
 */
export type PostcodeHit = {
  city: string;
  state: string;
  lat: number;
  lon: number;
};

// PLZ prefix → city centroid. Baden-Württemberg covered in detail; rest of
// DE has coarse fallbacks so the autofill still feels alive.
type PrefixEntry = { match: RegExp; city: string; state: string; lat: number; lon: number };

// Exact 5-digit PLZ overrides — Baden-Württemberg district-level precision.
// Checked before the prefix ranges so 70176 → Stuttgart-West (not just "Stuttgart").
const DE_EXACT: Record<string, { city: string; state: string; lat: number; lon: number }> = {
  // Stuttgart districts
  "70173": { city: "Stuttgart-Mitte", state: "Baden-Württemberg", lat: 48.7784, lon: 9.18 },
  "70174": { city: "Stuttgart-Mitte", state: "Baden-Württemberg", lat: 48.781, lon: 9.175 },
  "70176": { city: "Stuttgart-West", state: "Baden-Württemberg", lat: 48.7758, lon: 9.161 },
  "70178": { city: "Stuttgart-Süd", state: "Baden-Württemberg", lat: 48.766, lon: 9.167 },
  "70180": { city: "Stuttgart-Süd", state: "Baden-Württemberg", lat: 48.762, lon: 9.182 },
  "70182": { city: "Stuttgart-Mitte", state: "Baden-Württemberg", lat: 48.777, lon: 9.19 },
  "70184": { city: "Stuttgart-Ost", state: "Baden-Württemberg", lat: 48.783, lon: 9.202 },
  "70190": { city: "Stuttgart-Ost", state: "Baden-Württemberg", lat: 48.789, lon: 9.206 },
  "70191": { city: "Stuttgart-Nord", state: "Baden-Württemberg", lat: 48.794, lon: 9.177 },
  "70192": { city: "Stuttgart-Nord", state: "Baden-Württemberg", lat: 48.799, lon: 9.172 },
  "70193": { city: "Stuttgart-West", state: "Baden-Württemberg", lat: 48.781, lon: 9.154 },
  "70197": { city: "Stuttgart-West", state: "Baden-Württemberg", lat: 48.774, lon: 9.149 },
  "70199": { city: "Stuttgart-Süd", state: "Baden-Württemberg", lat: 48.758, lon: 9.162 },
  // Mannheim quadrats
  "68159": { city: "Mannheim", state: "Baden-Württemberg", lat: 49.4875, lon: 8.466 },
  "68161": { city: "Mannheim", state: "Baden-Württemberg", lat: 49.488, lon: 8.47 },
  "68163": { city: "Mannheim-Lindenhof", state: "Baden-Württemberg", lat: 49.477, lon: 8.459 },
  "68165": { city: "Mannheim-Oststadt", state: "Baden-Württemberg", lat: 49.483, lon: 8.482 },
  "68167": { city: "Mannheim-Neckarstadt", state: "Baden-Württemberg", lat: 49.5, lon: 8.467 },
  "68169": { city: "Mannheim-Neckarstadt", state: "Baden-Württemberg", lat: 49.507, lon: 8.458 },
  "68199": { city: "Mannheim-Neckarau", state: "Baden-Württemberg", lat: 49.456, lon: 8.478 },
  "68219": { city: "Mannheim-Rheinau", state: "Baden-Württemberg", lat: 49.43, lon: 8.493 },
  "68229": { city: "Mannheim-Friedrichsfeld", state: "Baden-Württemberg", lat: 49.447, lon: 8.545 },
  "68239": { city: "Mannheim-Seckenheim", state: "Baden-Württemberg", lat: 49.455, lon: 8.532 },
  "68259": { city: "Mannheim-Feudenheim", state: "Baden-Württemberg", lat: 49.503, lon: 8.523 },
  "68305": { city: "Mannheim-Waldhof", state: "Baden-Württemberg", lat: 49.527, lon: 8.467 },
  "68309": { city: "Mannheim-Käfertal", state: "Baden-Württemberg", lat: 49.52, lon: 8.504 },
  // Heidelberg districts
  "69115": { city: "Heidelberg-Weststadt", state: "Baden-Württemberg", lat: 49.402, lon: 8.681 },
  "69117": { city: "Heidelberg-Altstadt", state: "Baden-Württemberg", lat: 49.412, lon: 8.71 },
  "69118": { city: "Heidelberg-Ziegelhausen", state: "Baden-Württemberg", lat: 49.42, lon: 8.755 },
  "69120": { city: "Heidelberg-Neuenheim", state: "Baden-Württemberg", lat: 49.42, lon: 8.679 },
  "69121": {
    city: "Heidelberg-Handschuhsheim",
    state: "Baden-Württemberg",
    lat: 49.434,
    lon: 8.672,
  },
  "69123": { city: "Heidelberg-Pfaffengrund", state: "Baden-Württemberg", lat: 49.402, lon: 8.63 },
  "69124": { city: "Heidelberg-Kirchheim", state: "Baden-Württemberg", lat: 49.383, lon: 8.658 },
  "69126": { city: "Heidelberg-Rohrbach", state: "Baden-Württemberg", lat: 49.376, lon: 8.682 },
  // Karlsruhe / Freiburg / Ulm quick anchors
  "76131": { city: "Karlsruhe-Oststadt", state: "Baden-Württemberg", lat: 49.01, lon: 8.43 },
  "76133": {
    city: "Karlsruhe-Innenstadt-West",
    state: "Baden-Württemberg",
    lat: 49.009,
    lon: 8.391,
  },
  "76137": { city: "Karlsruhe-Südstadt", state: "Baden-Württemberg", lat: 48.999, lon: 8.413 },
  "79098": { city: "Freiburg-Altstadt", state: "Baden-Württemberg", lat: 47.997, lon: 7.85 },
  "79100": { city: "Freiburg-Wiehre", state: "Baden-Württemberg", lat: 47.986, lon: 7.848 },
  "79104": { city: "Freiburg-Neuburg", state: "Baden-Württemberg", lat: 48.008, lon: 7.85 },
  "89073": { city: "Ulm-Mitte", state: "Baden-Württemberg", lat: 48.401, lon: 9.988 },
  "89075": { city: "Ulm-Söflingen", state: "Baden-Württemberg", lat: 48.406, lon: 9.95 },
};

const DE_PREFIXES: PrefixEntry[] = [
  // Baden-Württemberg
  { match: /^68\d{3}$/, city: "Mannheim", state: "Baden-Württemberg", lat: 49.4875, lon: 8.466 },
  { match: /^69\d{3}$/, city: "Heidelberg", state: "Baden-Württemberg", lat: 49.3988, lon: 8.6724 },
  { match: /^70\d{3}$/, city: "Stuttgart", state: "Baden-Württemberg", lat: 48.7758, lon: 9.1829 },
  {
    match: /^71\d{3}$/,
    city: "Ludwigsburg",
    state: "Baden-Württemberg",
    lat: 48.8974,
    lon: 9.1916,
  },
  { match: /^72\d{3}$/, city: "Tübingen", state: "Baden-Württemberg", lat: 48.5216, lon: 9.0576 },
  { match: /^73\d{3}$/, city: "Göppingen", state: "Baden-Württemberg", lat: 48.7039, lon: 9.6526 },
  { match: /^74\d{3}$/, city: "Heilbronn", state: "Baden-Württemberg", lat: 49.1427, lon: 9.2109 },
  { match: /^75\d{3}$/, city: "Pforzheim", state: "Baden-Württemberg", lat: 48.8922, lon: 8.6946 },
  { match: /^76\d{3}$/, city: "Karlsruhe", state: "Baden-Württemberg", lat: 49.0069, lon: 8.4037 },
  { match: /^77\d{3}$/, city: "Offenburg", state: "Baden-Württemberg", lat: 48.4736, lon: 7.9446 },
  {
    match: /^78\d{3}$/,
    city: "Villingen-Schwenningen",
    state: "Baden-Württemberg",
    lat: 48.0606,
    lon: 8.4596,
  },
  { match: /^79\d{3}$/, city: "Freiburg", state: "Baden-Württemberg", lat: 47.999, lon: 7.8421 },
  { match: /^88\d{3}$/, city: "Ravensburg", state: "Baden-Württemberg", lat: 47.7833, lon: 9.6116 },
  { match: /^89\d{3}$/, city: "Ulm", state: "Baden-Württemberg", lat: 48.4011, lon: 9.9876 },
  // Other DE coarse fallbacks
  { match: /^10\d{3}$/, city: "Berlin", state: "Berlin", lat: 52.52, lon: 13.405 },
  { match: /^20\d{3}$/, city: "Hamburg", state: "Hamburg", lat: 53.5511, lon: 9.9937 },
  { match: /^50\d{3}$/, city: "Köln", state: "Nordrhein-Westfalen", lat: 50.9375, lon: 6.9603 },
  { match: /^60\d{3}$/, city: "Frankfurt am Main", state: "Hessen", lat: 50.1109, lon: 8.6821 },
  { match: /^80\d{3}$/, city: "München", state: "Bayern", lat: 48.1351, lon: 11.582 },
];

export function lookupGermanPostcode(plz: string): PostcodeHit | null {
  const trimmed = plz.trim();
  if (!/^\d{5}$/.test(trimmed)) return null;
  const exact = DE_EXACT[trimmed];
  if (exact) return { ...exact };
  const hit = DE_PREFIXES.find((entry) => entry.match.test(trimmed));
  return hit ? { city: hit.city, state: hit.state, lat: hit.lat, lon: hit.lon } : null;
}

/** Haversine distance between two lat/lon pairs in kilometres. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance between two German PLZs, or null if either is unknown. */
export function distanceBetweenPostcodes(a: string, b: string): number | null {
  const ha = lookupGermanPostcode(a);
  const hb = lookupGermanPostcode(b);
  if (!ha || !hb) return null;
  return distanceKm(ha, hb);
}
