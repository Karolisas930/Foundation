import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Field } from "./Card";

type CapacityScope =
  | "Small Residential"
  | "Large Residential"
  | "Commercial / Industrial"
  | "1x Wallbox Unit"
  | "Multiple Charging Stations"
  | "Full Heat Pump Electrical Link"
  | "Minor Repair / Single Room"
  | "Complete Apartment Refit"
  | "Full House New Build Installation"
  | "Maintenance / Small Fix"
  | "Bathroom Renovation"
  | "Complete Heating System Replacement";

export type TradeDetails = {
  extensionLength?: string;
  extensionShape?: "Rectangular" | "L-shape" | "U-shape" | "Other";
  extensionFloors?: string;
  newBuildSize?: string;
  newBuildFloors?: string;
  newBuildType?: "Single-family" | "Multi-family";
  bathroomSize?: string;
  bathroomCount?: string;
  roofType?: "Flat" | "Pitched";
  roofArea?: string;
  kitchenSize?: string;
  kitchenType?: "Straight" | "L-shape" | "U-shape" | "Island" | "Other";
  surfaceArea?: string;
  linearMeters?: string;
  capacityScope?: CapacityScope;
  foundationSurfaceArea?: string;
  excavationVolume?: string;
  loftFloorArea?: string;
  newBuildLivingArea?: string;
};

const AREA_TRADES = new Set<string>([
  "Tiling, Mosaics & Natural Stone",
  "Drywall, Insulation & Plastering",
  "Painting, Decorating & Facades",
  "Flooring, Parquet & Carpeting",
  "Interior Finishing & Fit-Out",
  "Building Cleaning & Property Services",
  "Screed & Floor Substrate Laying",
  "Roofing & Waterproofing",
  "Facade & Exterior Renovation",
]);

const LINEAR_TRADES = new Set<string>([
  "Structural Building & Masonry",
  "Carpentry & Timber Framing",
  "Scaffolding Services",
  "Demolition, Excavation & Groundworks",
  "Metalworking, Gates & Fencing",
  "Concrete Core Drilling & Structural Cutting",
]);

const INFRASTRUCTURE_TRADES = new Set<string>([
  "Solar & Photovoltaic (PV) Installation",
  "EV Charging Station & Heat Pump Power Hookups",
  "Electrical Systems & Smart Home",
  "Plumbing, Heating & HVAC",
]);

const LINEAR_TRADE_CONFIG: Record<string, { label: string; suffix: string }> = {
  "Structural Building & Masonry": { label: "Estimated Length / Dimensions", suffix: "m / Lfdm" },
  "Carpentry & Timber Framing": { label: "Estimated Length / Dimensions", suffix: "m / Lfdm" },
  "Scaffolding Services": { label: "Height / Surface area", suffix: "m²" },
  "Demolition, Excavation & Groundworks": { label: "Volume / Depth", suffix: "m³" },
  "Metalworking, Gates & Fencing": { label: "Estimated Length / Dimensions", suffix: "m / Lfdm" },
  "Concrete Core Drilling & Structural Cutting": {
    label: "Estimated Length / Dimensions",
    suffix: "m / Lfdm",
  },
};

const INFRASTRUCTURE_CONFIG: Record<
  string,
  { label: string; options: { value: CapacityScope; label: string }[] }
> = {
  "Solar & Photovoltaic (PV) Installation": {
    label: "Project Scale / Capacity Scope",
    options: [
      { value: "Small Residential", label: "Small Residential" },
      { value: "Large Residential", label: "Large Residential" },
      { value: "Commercial / Industrial", label: "Commercial / Industrial" },
    ],
  },
  "EV Charging Station & Heat Pump Power Hookups": {
    label: "Installation Scope",
    options: [
      { value: "1x Wallbox Unit", label: "1x Wallbox Unit" },
      { value: "Multiple Charging Stations", label: "Multiple Charging Stations" },
      { value: "Full Heat Pump Electrical Link", label: "Full Heat Pump Electrical Link" },
    ],
  },
  "Electrical Systems & Smart Home": {
    label: "Project Scale",
    options: [
      { value: "Minor Repair / Single Room", label: "Minor Repair / Single Room" },
      { value: "Complete Apartment Refit", label: "Complete Apartment Refit" },
      { value: "Full House New Build Installation", label: "Full House New Build Installation" },
    ],
  },
  "Plumbing, Heating & HVAC": {
    label: "Project Scope",
    options: [
      { value: "Maintenance / Small Fix", label: "Maintenance / Small Fix" },
      { value: "Bathroom Renovation", label: "Bathroom Renovation" },
      {
        value: "Complete Heating System Replacement",
        label: "Complete Heating System Replacement",
      },
    ],
  },
};

const wrapper =
  "rounded-xl border border-orange/25 bg-orange/5 p-4 space-y-4 animate-in fade-in-50 slide-in-from-top-1";
const darkWrapper =
  "rounded-xl border border-slate-800 bg-[#0f172a]/70 p-4 space-y-4 animate-in fade-in-50 slide-in-from-top-1 duration-200";

function MetricInput({
  id,
  label,
  suffix,
  value,
  onChange,
  placeholder,
  extraPad,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  extraPad?: boolean;
}) {
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("intake-input", extraPad ? "pr-16" : "pr-12")}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-400">
          {suffix}
        </span>
      </div>
    </Field>
  );
}

function MetricsHeader() {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
      Project metrics
    </p>
  );
}

export function TradeDetailsFields({
  trade,
  details,
  update,
}: {
  trade: string;
  details: TradeDetails;
  update: (patch: Partial<TradeDetails>) => void;
}) {
  if (!trade) return null;

  if (AREA_TRADES.has(trade)) {
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <MetricInput
          id="metric-area"
          label="Estimated Surface Area"
          suffix="m²"
          placeholder="e.g. 45"
          value={details.surfaceArea ?? ""}
          onChange={(v) => update({ surfaceArea: v })}
        />
      </div>
    );
  }

  if (LINEAR_TRADES.has(trade)) {
    const cfg = LINEAR_TRADE_CONFIG[trade] ?? {
      label: "Estimated Length / Dimensions",
      suffix: "m / Lfdm",
    };
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <MetricInput
          id="metric-length"
          label={cfg.label}
          suffix={cfg.suffix}
          placeholder="e.g. 25"
          extraPad={cfg.suffix.length > 4}
          value={details.linearMeters ?? ""}
          onChange={(v) => update({ linearMeters: v })}
        />
      </div>
    );
  }

  if (INFRASTRUCTURE_TRADES.has(trade)) {
    const cfg = INFRASTRUCTURE_CONFIG[trade] ?? {
      label: "Project Scale / Capacity Scope",
      options: [
        { value: "Small Residential" as CapacityScope, label: "Small Residential" },
        { value: "Large Residential" as CapacityScope, label: "Large Residential" },
        { value: "Commercial / Industrial" as CapacityScope, label: "Commercial / Industrial" },
      ],
    };
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <Field id="metric-scope" label={cfg.label}>
          <Select
            value={details.capacityScope}
            onValueChange={(v) => update({ capacityScope: v as CapacityScope })}
          >
            <SelectTrigger id="metric-scope" className="intake-input h-10">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              {cfg.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  if (trade === "Basement & Foundation Construction") {
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricInput
            id="metric-foundation-area"
            label="Foundation Surface Area"
            suffix="m²"
            placeholder="e.g. 120"
            value={details.foundationSurfaceArea ?? ""}
            onChange={(v) => update({ foundationSurfaceArea: v })}
          />
          <MetricInput
            id="metric-excavation-volume"
            label="Excavation Volume / Depth"
            suffix="m³"
            placeholder="e.g. 80"
            value={details.excavationVolume ?? ""}
            onChange={(v) => update({ excavationVolume: v })}
          />
        </div>
      </div>
    );
  }

  if (trade === "Loft Conversion & Attic Renovation") {
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <MetricInput
          id="metric-loft-area"
          label="Estimated Living/Floor Area"
          suffix="m²"
          placeholder="e.g. 35"
          value={details.loftFloorArea ?? ""}
          onChange={(v) => update({ loftFloorArea: v })}
        />
      </div>
    );
  }

  if (trade === "New Build & Extension Specialist") {
    return (
      <div className={darkWrapper}>
        <MetricsHeader />
        <MetricInput
          id="metric-newbuild-area"
          label="Total Planned Living Area"
          suffix="m²"
          placeholder="e.g. 220"
          value={details.newBuildLivingArea ?? ""}
          onChange={(v) => update({ newBuildLivingArea: v })}
        />
      </div>
    );
  }

  if (trade === "House Extension") {
    return (
      <div className={wrapper}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Extension details
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="ext-length" label="Length (m)">
            <Input
              id="ext-length"
              inputMode="decimal"
              placeholder="e.g. 6"
              value={details.extensionLength ?? ""}
              onChange={(e) => update({ extensionLength: e.target.value })}
              className="intake-input"
            />
          </Field>
          <Field id="ext-shape" label="Shape">
            <Select
              value={details.extensionShape}
              onValueChange={(v) => update({ extensionShape: v as TradeDetails["extensionShape"] })}
            >
              <SelectTrigger id="ext-shape" className="intake-input h-10">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rectangular">Rectangular</SelectItem>
                <SelectItem value="L-shape">L-shape</SelectItem>
                <SelectItem value="U-shape">U-shape</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="ext-floors" label="Floors">
            <Input
              id="ext-floors"
              inputMode="numeric"
              placeholder="e.g. 2"
              value={details.extensionFloors ?? ""}
              onChange={(e) => update({ extensionFloors: e.target.value.replace(/\D/g, "") })}
              className="intake-input"
            />
          </Field>
        </div>
      </div>
    );
  }

  if (trade === "New Build") {
    return (
      <div className={wrapper}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          New build details
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="nb-size" label="Total size (m²)">
            <Input
              id="nb-size"
              inputMode="decimal"
              placeholder="e.g. 180"
              value={details.newBuildSize ?? ""}
              onChange={(e) => update({ newBuildSize: e.target.value })}
              className="intake-input"
            />
          </Field>
          <Field id="nb-floors" label="Floors">
            <Input
              id="nb-floors"
              inputMode="numeric"
              placeholder="e.g. 2"
              value={details.newBuildFloors ?? ""}
              onChange={(e) => update({ newBuildFloors: e.target.value.replace(/\D/g, "") })}
              className="intake-input"
            />
          </Field>
          <Field id="nb-type" label="Type">
            <Select
              value={details.newBuildType}
              onValueChange={(v) => update({ newBuildType: v as TradeDetails["newBuildType"] })}
            >
              <SelectTrigger id="nb-type" className="intake-input h-10">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single-family">Single-family</SelectItem>
                <SelectItem value="Multi-family">Multi-family</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }

  if (trade === "Bathroom Renovation") {
    return (
      <div className={wrapper}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Bathroom details
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bath-size" label="Size (m²)">
            <Input
              id="bath-size"
              inputMode="decimal"
              placeholder="e.g. 8"
              value={details.bathroomSize ?? ""}
              onChange={(e) => update({ bathroomSize: e.target.value })}
              className="intake-input"
            />
          </Field>
          <Field id="bath-count" label="Number of bathrooms">
            <Input
              id="bath-count"
              inputMode="numeric"
              placeholder="e.g. 2"
              value={details.bathroomCount ?? ""}
              onChange={(e) => update({ bathroomCount: e.target.value.replace(/\D/g, "") })}
              className="intake-input"
            />
          </Field>
        </div>
      </div>
    );
  }

  if (trade === "Kitchen Renovation") {
    return (
      <div className={wrapper}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Kitchen details
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="kit-size" label="Size (m²)">
            <Input
              id="kit-size"
              inputMode="decimal"
              placeholder="e.g. 14"
              value={details.kitchenSize ?? ""}
              onChange={(e) => update({ kitchenSize: e.target.value })}
              className="intake-input"
            />
          </Field>
          <Field id="kit-type" label="Layout type">
            <Select
              value={details.kitchenType}
              onValueChange={(v) => update({ kitchenType: v as TradeDetails["kitchenType"] })}
            >
              <SelectTrigger id="kit-type" className="intake-input h-10">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Straight">Straight</SelectItem>
                <SelectItem value="L-shape">L-shape</SelectItem>
                <SelectItem value="U-shape">U-shape</SelectItem>
                <SelectItem value="Island">Island</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }

  return null;
}
