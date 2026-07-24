import {
  Zap,
  PaintBucket,
  Home as HomeIcon,
  Hammer,
  Ruler,
  Droplets,
  TreePine,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StepIndex = 0 | 1 | 2;

export interface WizardState {
  categoryId: string | null;
  postalCode: string;
  budgetId: string | null;
}

export const STEP_LABELS = ["Category", "Location", "Budget"] as const;

/**
 * Curated top-level categories. Each entry maps to a canonical trade string
 * from `TRADE_OPTIONS` in src/lib/country-data.ts so downstream ledger
 * consumers (dashboard, matching engine) recognise it as a first-class trade.
 */
export const CATEGORIES: ReadonlyArray<{
  id: string;
  label: string;
  trade: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    id: "roofing",
    label: "Roofing",
    trade: "Roofing & Waterproofing",
    hint: "Repairs · new roofs · gutters",
    icon: HomeIcon,
  },
  {
    id: "electrical",
    label: "Electrical",
    trade: "Electrical Systems & Smart Home",
    hint: "Wiring · sockets · smart home",
    icon: Zap,
  },
  {
    id: "painting",
    label: "Painting",
    trade: "Painting, Decorating & Facades",
    hint: "Interior · facades · decor",
    icon: PaintBucket,
  },
  {
    id: "drywall",
    label: "Drywalling",
    trade: "Drywall, Insulation & Plastering",
    hint: "Walls · ceilings · insulation",
    icon: Ruler,
  },
  {
    id: "plumbing",
    label: "Plumbing",
    trade: "Plumbing, Heating & HVAC",
    hint: "Leaks · heating · bathrooms",
    icon: Droplets,
  },
  {
    id: "carpentry",
    label: "Carpentry",
    trade: "Carpentry & Timber Framing",
    hint: "Framing · timber · repairs",
    icon: Hammer,
  },
  {
    id: "flooring",
    label: "Flooring",
    trade: "Flooring, Parquet & Carpeting",
    hint: "Parquet · tiles · carpet",
    icon: Wrench,
  },
  {
    id: "garden",
    label: "Landscaping",
    trade: "Landscaping, Patios & Gardening",
    hint: "Patios · gardens · fences",
    icon: TreePine,
  },
  {
    id: "other",
    label: "Something else",
    trade: "General Handyman & Assembly Services",
    hint: "Any other trade",
    icon: Sparkles,
  },
];

/**
 * The `value` is what we hand to the Matching Filter Engine as the project's
 * `estimatedBudget`. We use the TOP of each range so the classifier's
 * `estimatedBudget >= minProjectSize` rule stays predictable and the
 * "under €500" bucket falls below typical contractor thresholds (routed
 * silently to /notifications) while larger buckets surface as priority.
 */
export const BUDGETS: ReadonlyArray<{
  id: string;
  label: string;
  hint: string;
  value: number;
}> = [
  { id: "s", label: "Under €500", hint: "Small fix or single visit", value: 499 },
  { id: "m", label: "€500 – €1,500", hint: "Half-day to full-day scope", value: 1500 },
  { id: "l", label: "€1,500 – €2,500", hint: "Multi-day project", value: 2500 },
  { id: "xl", label: "€2,500+", hint: "Larger renovation", value: 5000 },
];
