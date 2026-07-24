/**
 * Shared constants for the HandymanOnboarding flow.
 * Extracted from HandymanOnboarding.tsx so step components and the main
 * form can reference them without duplicating literals.
 */

export const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
  { code: "lv", label: "Latviešu", flag: "🇱🇻" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
  { code: "mt", label: "Malti", flag: "🇲🇹" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export const CARD_CLS =
  "scroll-mt-44 mb-6 rounded-2xl border border-slate-800/80 bg-[#1e293b]/60 p-5 sm:p-6 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md space-y-5 transition-all duration-200 hover:border-slate-700";
export const HEADER_CLS = "flex items-center gap-2 text-base font-bold tracking-tight text-white";

export const SECTIONS = [
  { id: "identity", label: "Company", short: "Co." },
  { id: "trades", label: "Trades", short: "Tr." },
  { id: "area", label: "Region", short: "Rg." },
  { id: "contact", label: "Contact", short: "Ct." },
  { id: "profile", label: "Profile", short: "Pr." },
] as const;

export const TEAM_PRESETS = [1, 2, 5, 10, 25];
export const MIN_PROJECT_PRESETS = [500, 1000, 2500, 5000, 10000];

// Grouped trade categories rendered in the accordion picker.
// Every entry in TRADE_OPTIONS must appear in exactly one category so custom
// user-added trades can also fall back to an "Other" bucket.
export const TRADE_CATEGORIES: Array<{ id: string; label: string; trades: string[] }> = [
  {
    id: "cat-building-tech",
    label: "Building Technology & Electrical",
    trades: [
      "Electrical Systems & Smart Home",
      "Plumbing, Heating & HVAC",
      "Gas & Water Installation",
      "Refrigeration, Air Conditioning & Cooling Systems",
      "EV Charging Station & Heat Pump Installation",
      "Chimney Sweeping & Energy Auditing",
      "Smart Home & Building Automation",
      "Solar & Photovoltaic (PV) Installation",
    ],
  },
  {
    id: "cat-structural",
    label: "Structural & Renovation",
    trades: [
      "Structural Building & Masonry",
      "Bricklaying & Concrete",
      "Carpentry & Timber Framing",
      "Roofing & Waterproofing",
      "Scaffolding Services",
      "Demolition, Excavation & Groundworks",
      "Basement & Foundation Construction",
      "Loft Conversion & Attic Renovation",
      "New Build & Extension Specialist",
      "Facade & Exterior Renovation",
      "Metalworking, Gates & Fencing",
      "Water, Fire & Mold Damage Restoration",
    ],
  },
  {
    id: "cat-interior",
    label: "Interior & Finishing",
    trades: [
      "Glazing & Window Engineering",
      "Tiling, Mosaics & Natural Stone",
      "Drywall, Insulation & Plastering",
      "Painting, Decorating & Facades",
      "Flooring, Parquet & Carpeting",
      "Joinery, Custom Cabinetry & Doors",
      "Interior Finishing & Fit-Out",
      "Building Cleaning & Property Services",
      "Landscaping, Patios & Gardening",
      "General Handyman & Assembly Services",
      "Stonemasonry & Monument Restoration",
    ],
  },
  {
    id: "cat-energy-roof",
    label: "Energy, Roof & Exterior Infrastructure",
    trades: [
      "Solar & Photovoltaic (PV) Installation",
      "EV Charging Station & Heat Pump Power Hookups",
      "Sheet Metal Work & Exterior Roof Drainage",
      "Thermal, Cold & Sound Insulation",
      "Building Waterproofing & Structural Drying",
      "Tile Stove & Fireplace Construction",
      "Well Drilling & Geothermal Exploration",
      "Green Roof & Sustainable Construction",
      "Energy Efficiency Consulting",
    ],
  },
  {
    id: "cat-logistics",
    label: "Upstream Logistics & Project Services",
    trades: [
      "Screed & Floor Substrate Laying",
      "Concrete Core Drilling & Structural Cutting",
      "Locksmith Services & Home Security Systems",
      "Asbestos & Hazardous Material Remediation",
      "Facility Management & Maintenance",
      "Construction Logistics & Material Supply",
    ],
  },
];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[+\d][\d\s\-()/]{6,}$/;
