export const TRADE_OPTIONS = [
  // Building Technology & Electrical
  "Electrical Systems & Smart Home",
  "Plumbing, Heating & HVAC",
  "Gas & Water Installation",
  "Refrigeration, Air Conditioning & Cooling Systems",
  "EV Charging Station & Heat Pump Installation",
  "Chimney Sweeping & Energy Auditing",
  "Smart Home & Building Automation",
  "Solar & Photovoltaic (PV) Installation",
  // Structural & Renovation
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
  // Interior & Finishing
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
  // Energy, Roof & Exterior Infrastructure
  "EV Charging Station & Heat Pump Power Hookups",
  "Sheet Metal Work & Exterior Roof Drainage",
  "Thermal, Cold & Sound Insulation",
  "Building Waterproofing & Structural Drying",
  "Tile Stove & Fireplace Construction",
  "Well Drilling & Geothermal Exploration",
  "Green Roof & Sustainable Construction",
  "Energy Efficiency Consulting",
  // Upstream Logistics & Project Services
  "Screed & Floor Substrate Laying",
  "Concrete Core Drilling & Structural Cutting",
  "Locksmith Services & Home Security Systems",
  "Asbestos & Hazardous Material Remediation",
  "Facility Management & Maintenance",
  "Construction Logistics & Material Supply",
] as const;

// Trades that require a Meister certificate (meister_required = true).
// Kept server-side for legal compliance; the onboarding UI intentionally does
// NOT surface this as a badge/label to keep trade selection clean.
export const REGULATED_TRADES = new Set<string>([
  // Building Technology & Electrical
  "Electrical Systems & Smart Home",
  "Plumbing, Heating & HVAC",
  "Gas & Water Installation",
  "Refrigeration, Air Conditioning & Cooling Systems",
  "EV Charging Station & Heat Pump Installation",
  "Chimney Sweeping & Energy Auditing",
  "Solar & Photovoltaic (PV) Installation",
  // Structural & Renovation
  "Structural Building & Masonry",
  "Bricklaying & Concrete",
  "Carpentry & Timber Framing",
  "Roofing & Waterproofing",
  "Scaffolding Services",
  "Basement & Foundation Construction",
  "Metalworking, Gates & Fencing",
  "Water, Fire & Mold Damage Restoration",
  // Interior & Finishing
  "Glazing & Window Engineering",
  "Tiling, Mosaics & Natural Stone",
  "Joinery, Custom Cabinetry & Doors",
  "Stonemasonry & Monument Restoration",
  // Energy, Roof & Exterior Infrastructure
  "EV Charging Station & Heat Pump Power Hookups",
  "Building Waterproofing & Structural Drying",
  "Well Drilling & Geothermal Exploration",
  // Upstream Logistics & Project Services
  "Locksmith Services & Home Security Systems",
  "Asbestos & Hazardous Material Remediation",
]);

// Server-side alias — the canonical set of trades flagged meister_required
// for backend/database checks and compliance logic.
export const MEISTER_REQUIRED_TRADES = REGULATED_TRADES;
export const isMeisterRequired = (trade: string): boolean => REGULATED_TRADES.has(trade);

// Trades where a Meister qualification is voluntary but allowed to be displayed.
export const VOLUNTARY_MEISTER_TRADES = new Set<string>(["Painting, Decorating & Facades"]);

// Trades that may upload a Meister certificate and show a Meister badge
// (regulated trades + voluntary Meister trades like Painting).
export const MEISTER_ELIGIBLE_TRADES = new Set<string>([
  ...REGULATED_TRADES,
  ...VOLUNTARY_MEISTER_TRADES,
]);
