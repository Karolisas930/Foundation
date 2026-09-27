/**
 * Canonical trade codes.
 *
 * Every trade has one language-independent code (e.g. "electrical_smart_home").
 * Jobs and contractor profiles store and match on these codes, so a job posted
 * in German matches a profile registered in English. UI shows localized labels
 * via `tradeLabel(code, lang)`.
 */
import { TRADE_OPTIONS } from "./country-data";

export type TradeCode = string;

function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(pv\)/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** code -> canonical English label */
export const TRADE_CODE_LABELS_EN: Readonly<Record<TradeCode, string>> = Object.fromEntries(
  TRADE_OPTIONS.map((l) => [slug(l), l]),
);

export const TRADE_CODES: readonly TradeCode[] = Object.keys(TRADE_CODE_LABELS_EN);

/** Localized German labels (fallback to English when missing). */
const DE_LABELS: Record<string, string> = {
  "Electrical Systems & Smart Home": "Elektrotechnik & Smart Home",
  "Plumbing, Heating & HVAC": "Sanitär, Heizung & Klima",
  "Gas & Water Installation": "Gas- & Wasserinstallation",
  "Refrigeration, Air Conditioning & Cooling Systems": "Kälte- & Klimatechnik",
  "EV Charging Station & Heat Pump Installation": "Wallbox & Wärmepumpen-Installation",
  "Chimney Sweeping & Energy Auditing": "Schornsteinfeger & Energieberatung",
  "Smart Home & Building Automation": "Smart Home & Gebäudeautomation",
  "Solar & Photovoltaic (PV) Installation": "Solar & Photovoltaik",
  "Structural Building & Masonry": "Hochbau & Mauerwerk",
  "Bricklaying & Concrete": "Maurer- & Betonarbeiten",
  "Carpentry & Timber Framing": "Zimmerei & Holzbau",
  "Roofing & Waterproofing": "Dachdecker & Abdichtung",
  "Scaffolding Services": "Gerüstbau",
  "Demolition, Excavation & Groundworks": "Abbruch, Aushub & Erdarbeiten",
  "Basement & Foundation Construction": "Keller- & Fundamentbau",
  "Loft Conversion & Attic Renovation": "Dachausbau",
  "New Build & Extension Specialist": "Neubau & Anbau",
  "Facade & Exterior Renovation": "Fassadensanierung",
  "Metalworking, Gates & Fencing": "Metallbau, Tore & Zäune",
  "Water, Fire & Mold Damage Restoration": "Wasser-, Brand- & Schimmelsanierung",
  "Glazing & Window Engineering": "Glaserei & Fensterbau",
  "Tiling, Mosaics & Natural Stone": "Fliesen, Mosaik & Naturstein",
  "Drywall, Insulation & Plastering": "Trockenbau, Dämmung & Putz",
  "Painting, Decorating & Facades": "Maler & Lackierer",
  "Flooring, Parquet & Carpeting": "Bodenbeläge & Parkett",
  "Joinery, Custom Cabinetry & Doors": "Tischlerei & Türen",
  "Interior Finishing & Fit-Out": "Innenausbau",
  "Building Cleaning & Property Services": "Gebäudereinigung",
  "Landscaping, Patios & Gardening": "Garten- & Landschaftsbau",
  "General Handyman & Assembly Services": "Hausmeister- & Montageservice",
  "Stonemasonry & Monument Restoration": "Steinmetz & Denkmalpflege",
  "Sheet Metal Work & Exterior Roof Drainage": "Klempnerei & Dachentwässerung",
  "Thermal, Cold & Sound Insulation": "Wärme-, Kälte- & Schallschutz",
  "Building Waterproofing & Structural Drying": "Bauwerksabdichtung & Trocknung",
  "Tile Stove & Fireplace Construction": "Ofen- & Kaminbau",
  "Well Drilling & Geothermal Exploration": "Brunnenbau & Geothermie",
  "Screed & Floor Substrate Laying": "Estricharbeiten",
  "Locksmith Services & Home Security Systems": "Schlüsseldienst & Sicherheitstechnik",
  "Asbestos & Hazardous Material Remediation": "Asbest- & Schadstoffsanierung",
};

/** Legacy / free-text / other-language values -> code. Keys are lowercased. */
const ALIASES: Record<string, TradeCode> = {
  electrical: slug("Electrical Systems & Smart Home"),
  "electrical engineering": slug("Electrical Systems & Smart Home"),
  elektro: slug("Electrical Systems & Smart Home"),
  elektrik: slug("Electrical Systems & Smart Home"),
  elektriker: slug("Electrical Systems & Smart Home"),
  elektrotechnik: slug("Electrical Systems & Smart Home"),
  plumbing: slug("Plumbing, Heating & HVAC"),
  "plumbing & heating": slug("Plumbing, Heating & HVAC"),
  sanitär: slug("Plumbing, Heating & HVAC"),
  heizung: slug("Plumbing, Heating & HVAC"),
  shk: slug("Plumbing, Heating & HVAC"),
  fundamente: slug("Basement & Foundation Construction"),
  fundament: slug("Basement & Foundation Construction"),
  mauerwerk: slug("Structural Building & Masonry"),
  maurer: slug("Bricklaying & Concrete"),
  beton: slug("Bricklaying & Concrete"),
  sanierung: slug("Facade & Exterior Renovation"),
  renovation: slug("Interior Finishing & Fit-Out"),
  roofing: slug("Roofing & Waterproofing"),
  dach: slug("Roofing & Waterproofing"),
  dachdecker: slug("Roofing & Waterproofing"),
  carpentry: slug("Carpentry & Timber Framing"),
  zimmerei: slug("Carpentry & Timber Framing"),
  tischler: slug("Joinery, Custom Cabinetry & Doors"),
  schreiner: slug("Joinery, Custom Cabinetry & Doors"),
  painting: slug("Painting, Decorating & Facades"),
  "painting & decorating": slug("Painting, Decorating & Facades"),
  maler: slug("Painting, Decorating & Facades"),
  tiling: slug("Tiling, Mosaics & Natural Stone"),
  "tiling & stone": slug("Tiling, Mosaics & Natural Stone"),
  fliesen: slug("Tiling, Mosaics & Natural Stone"),
  landscaping: slug("Landscaping, Patios & Gardening"),
  garten: slug("Landscaping, Patios & Gardening"),
  solar: slug("Solar & Photovoltaic (PV) Installation"),
  photovoltaik: slug("Solar & Photovoltaic (PV) Installation"),
  trockenbau: slug("Drywall, Insulation & Plastering"),
  "ev charging station & heat pump power hookups": slug(
    "EV Charging Station & Heat Pump Installation",
  ),
};
for (const [en, de] of Object.entries(DE_LABELS)) ALIASES[de.toLowerCase()] = slug(en);
for (const [code, en] of Object.entries(TRADE_CODE_LABELS_EN)) {
  ALIASES[en.toLowerCase()] = code;
  ALIASES[code] = code;
}

/** Map any stored trade value (code, English/German label, legacy text) to its code. */
export function toTradeCode(value: string | null | undefined): TradeCode | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  return ALIASES[v] ?? ALIASES[slug(v)] ?? null;
}

/** Codes for a list; unmapped values are kept as lowercased text (tolerant fallback). */
export function toTradeKeys(values: readonly (string | null | undefined)[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const v of values ?? []) {
    if (!v) continue;
    out.add(toTradeCode(v) ?? v.trim().toLowerCase());
  }
  return [...out];
}

/** Localized display label for a code (or legacy value). */
export function tradeLabel(value: string | null | undefined, lang: string = "en"): string {
  if (!value) return "";
  const code = toTradeCode(value);
  const en = code ? TRADE_CODE_LABELS_EN[code] : undefined;
  if (!en) return value;
  if (lang.toLowerCase().startsWith("de")) return DE_LABELS[en] ?? en;
  return en;
}

/** Exposed for SQL backfill generation / tests. */
export const TRADE_ALIASES: Readonly<Record<string, TradeCode>> = ALIASES;
