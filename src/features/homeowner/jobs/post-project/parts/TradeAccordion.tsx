import { type ComponentType } from "react";
import {
  AppWindow,
  ArrowDownToLine,
  Building,
  Building2,
  ChevronsUp,
  DoorOpen,
  Drill,
  Droplet,
  Fence,
  Flame,
  Grid2x2,
  Hammer,
  HardHat,
  Home,
  Layers,
  Paintbrush,
  PanelTop,
  Pickaxe,
  PlugZap,
  Shield,
  ShieldAlert,
  Smartphone,
  Snowflake,
  Sofa,
  Sparkles,
  Square,
  Sun,
  Thermometer,
  Trees,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { TRADE_OPTIONS, TRADE_GROUPS } from "@/regions";

const TRADE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Electrical Systems & Smart Home": Zap,
  "Plumbing, Heating & HVAC": Droplet,
  "Gas & Water Installation": Droplet,
  "Smart Home & Building Automation": Smartphone,
  "Chimney Sweeping & Energy Auditing": Flame,
  "EV Charging Station & Heat Pump Installation": PlugZap,
  "Structural Building & Masonry": Building,
  "Bricklaying & Concrete": Building,
  "Carpentry & Timber Framing": Hammer,
  "Roofing & Waterproofing": Home,
  "Scaffolding Services": HardHat,
  "Demolition, Excavation & Groundworks": Pickaxe,
  "Basement & Foundation Construction": ArrowDownToLine,
  "Loft Conversion & Attic Renovation": ChevronsUp,
  "New Build & Extension Specialist": Building2,
  "Facade & Exterior Renovation": Square,
  "Metalworking, Gates & Fencing": Fence,
  "Water, Fire & Mold Damage Restoration": Waves,
  "Glazing & Window Engineering": AppWindow,
  "Tiling, Mosaics & Natural Stone": Grid2x2,
  "Drywall, Insulation & Plastering": Layers,
  "Painting, Decorating & Facades": Paintbrush,
  "Flooring, Parquet & Carpeting": PanelTop,
  "Joinery, Custom Cabinetry & Doors": DoorOpen,
  "Interior Finishing & Fit-Out": Sofa,
  "Building Cleaning & Property Services": Sparkles,
  "Landscaping, Patios & Gardening": Trees,
  "General Handyman & Assembly Services": Wrench,
  "Stonemasonry & Monument Restoration": Building,
  "Solar & Photovoltaic (PV) Installation": Sun,
  "EV Charging Station & Heat Pump Power Hookups": PlugZap,
  "Sheet Metal Work & Exterior Roof Drainage": Wrench,
  "Refrigeration, Air Conditioning & Cooling Systems": Snowflake,
  "Well Drilling & Geothermal Exploration": Waves,
  "Thermal, Cold & Sound Insulation": Thermometer,
  "Building Waterproofing & Structural Drying": Droplet,
  "Tile Stove & Fireplace Construction": Flame,
  "Green Roof & Sustainable Construction": Trees,
  "Energy Efficiency Consulting": Sun,
  "Screed & Floor Substrate Laying": Layers,
  "Concrete Core Drilling & Structural Cutting": Drill,
  "Locksmith Services & Home Security Systems": Shield,
  "Asbestos & Hazardous Material Remediation": ShieldAlert,
  "Facility Management & Maintenance": Wrench,
  "Construction Logistics & Material Supply": Wrench,
};



export function TradeAccordion({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const openByDefault = value
    ? TRADE_GROUPS.find((g) => g.trades.includes(value as (typeof TRADE_OPTIONS)[number]))?.label
    : undefined;

  return (
    <Accordion
      type="single"
      collapsible={true}
      defaultValue={openByDefault}
      className="rounded-xl border border-slate-800 bg-[#0f172a]/70 overflow-hidden space-y-4"
    >
      {TRADE_GROUPS.map((group) => (
        <AccordionItem
          key={group.label}
          value={group.label}
          className="border-b border-slate-800/80 last:border-b-0"
        >
          <AccordionTrigger className="px-6 py-5 min-h-[64px] text-sm font-semibold text-white hover:bg-[#1e293b]/60 hover:no-underline data-[state=open]:bg-orange/10 data-[state=open]:text-white">
            {group.label}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {group.trades.map((t) => {
                const selected = value === t;
                const TradeIcon = TRADE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange(t)}
                    aria-pressed={selected}
                    className={cn(
                      "group relative flex h-28 min-h-[112px] w-full flex-col items-start justify-start gap-2 rounded-xl border-2 p-3 text-left transition-all",
                      selected
                        ? "border-orange bg-orange/15 text-white shadow-[0_0_20px_rgba(251,146,60,0.35)] ring-2 ring-orange/60"
                        : "border-slate-800 bg-[#1e293b] text-slate-200 hover:border-orange/60 hover:bg-[#1e293b]/90 hover:text-white",
                    )}
                  >
                    {TradeIcon && (
                      <TradeIcon
                        className={cn(
                          "size-5 shrink-0 transition-colors",
                          selected ? "text-orange" : "text-slate-400 group-hover:text-orange",
                        )}
                      />
                    )}
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-white">
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
