/**
 * ProjectBasicsCard — project title, required trade, and the conditional
 * trade-specific fields revealed once a trade is picked.
 *
 * Also: lightweight keyword-based auto-suggestion of "Required trade" from
 * the project title (no network calls, no AI). Shows a "Suggested: X" pill
 * above the dropdown when a match is detected; the homeowner can apply it
 * with one tap or ignore it and pick manually.
 */
import { useMemo } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TRADE_OPTIONS } from "@/regions";
import { Card, Field, TradeCombobox, TradeDetailsFields, type TradeDetails } from "./parts";

// Keyword → trade label. Keys are matched case-insensitively against the
// project title; the first hit wins. Kept here (not in protected
// country-data.ts) so we can iterate freely.
const TRADE_KEYWORDS: Array<{ keywords: string[]; trade: (typeof TRADE_OPTIONS)[number] }> = [
  { keywords: ["roof", "shingle", "gutter", "dach"], trade: "Roofing & Waterproofing" },
  { keywords: ["fence", "gate", "railing", "zaun"], trade: "Metalworking, Gates & Fencing" },
  {
    keywords: ["garden", "patio", "lawn", "landscap", "hedge", "garten"],
    trade: "Landscaping, Patios & Gardening",
  },
  {
    keywords: ["bathroom", "shower", "toilet", "sink", "plumb", "heating", "boiler", "bad"],
    trade: "Plumbing, Heating & HVAC",
  },
  {
    keywords: ["electric", "wiring", "socket", "smart home", "lighting", "elektr"],
    trade: "Electrical Systems & Smart Home",
  },
  { keywords: ["tile", "mosaic", "stone", "fliesen"], trade: "Tiling, Mosaics & Natural Stone" },
  {
    keywords: ["floor", "parquet", "carpet", "laminate", "boden"],
    trade: "Flooring, Parquet & Carpeting",
  },
  { keywords: ["paint", "decorat", "facade", "fassade"], trade: "Painting, Decorating & Facades" },
  { keywords: ["window", "glaz", "fenster"], trade: "Glazing & Window Engineering" },
  {
    keywords: ["drywall", "plaster", "insulation", "trockenbau"],
    trade: "Drywall, Insulation & Plastering",
  },
  {
    keywords: ["kitchen", "cabinet", "joinery", "door", "küche"],
    trade: "Joinery, Custom Cabinetry & Doors",
  },
  { keywords: ["carpent", "timber", "wood frame", "zimmer"], trade: "Carpentry & Timber Framing" },
  {
    keywords: ["chimney", "fireplace", "stove", "kamin"],
    trade: "Tile Stove & Fireplace Construction",
  },
  { keywords: ["loft", "attic", "dachboden"], trade: "Loft Conversion & Attic Renovation" },
  { keywords: ["basement", "foundation", "keller"], trade: "Basement & Foundation Construction" },
  { keywords: ["clean", "reinig"], trade: "Building Cleaning & Property Services" },
  {
    keywords: ["mold", "water damage", "fire damage", "schimmel"],
    trade: "Water, Fire & Mold Damage Restoration",
  },
  { keywords: ["scaffold", "gerüst"], trade: "Scaffolding Services" },
  { keywords: ["demolit", "excavat", "abriss"], trade: "Demolition, Excavation & Groundworks" },
  { keywords: ["gate", "fence", "metalwork", "zaun"], trade: "Metalworking, Gates & Fencing" },
  {
    keywords: ["assembly", "ikea", "mount", "handyman"],
    trade: "General Handyman & Assembly Services",
  },
];

function suggestTrade(title: string): string | null {
  const t = title.toLowerCase().trim();
  if (t.length < 4) return null;
  for (const { keywords, trade } of TRADE_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return trade;
  }
  return null;
}

export function ProjectBasicsCard({
  projectTitle,
  setProjectTitle,
  trade,
  setTrade,
  tradeDetails,
  updateTradeDetails,
  resetTradeDetails,
}: {
  projectTitle: string;
  setProjectTitle: (v: string) => void;
  trade: string;
  setTrade: (v: string) => void;
  tradeDetails: TradeDetails;
  updateTradeDetails: (patch: Partial<TradeDetails>) => void;
  resetTradeDetails: () => void;
}) {
  const suggested = useMemo(() => suggestTrade(projectTitle), [projectTitle]);
  const showSuggestion = Boolean(suggested) && suggested !== trade;

  return (
    <Card
      tone={1}
      id="card_project_basics"
      icon={<FileText className="size-4" />}
      title="Project basics"
    >
      <div className="space-y-5">
        <Field id="projectTitle" label="Project title" required>
          <Input
            id="projectTitle"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            maxLength={120}
            placeholder="Replace garden wall & pour new foundation"
            required
            className="intake-input"
          />
        </Field>
        <Field id="trade" label="Required trade" required>
          {showSuggestion && suggested && (
            <button
              type="button"
              onClick={() => {
                setTrade(suggested);
                resetTradeDetails();
              }}
              className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-xs font-semibold text-orange-glow transition hover:border-orange hover:bg-orange/15"
              aria-label={`Apply suggested trade: ${suggested}`}
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span className="truncate">
                Suggested: <span className="font-bold">{suggested}</span>
              </span>
              <span className="ml-1 rounded-full bg-orange/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Tap to apply
              </span>
            </button>
          )}
          <TradeCombobox
            value={trade}
            onChange={(next) => {
              setTrade(next);
              resetTradeDetails();
            }}
          />
        </Field>
        <TradeDetailsFields trade={trade} details={tradeDetails} update={updateTradeDetails} />
      </div>
    </Card>
  );
}
