/**
 * TradeAccordion — categorised, collapsible card grid used by the Trades
 * step of the HandymanOnboarding flow. Owns its own open-category state
 * and search-driven auto-expansion.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Droplet,
  Hammer,
  Home as HomeIcon,
  Layers,
  Shield,
  Sun,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
<<<<<<< HEAD
=======
import { TRADE_OPTIONS, TRADE_GROUPS } from "@/regions";
>>>>>>> a8a610c8d2c27f0efe9bbbbf6871afff876a3265

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "cat-building-tech": Zap,
  "cat-structural": Hammer,
  "cat-interior": HomeIcon,
  "cat-energy-roof": Sun,
  "cat-logistics": Layers,
};

<<<<<<< HEAD
const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  electrical: Zap,
  plumbing: Droplet,
  roofing: HomeIcon,
  solar: Sun,
  security: Shield,
  default: Wrench,
};

function iconForTrade(name: string) {
  const n = name.toLowerCase();
  if (n.includes("electric") || n.includes("smart") || n.includes("ev "))
    return TRADE_ICONS.electrical;
  if (n.includes("plumb") || n.includes("water") || n.includes("waterproof"))
    return TRADE_ICONS.plumbing;
  if (n.includes("roof")) return TRADE_ICONS.roofing;
  if (n.includes("solar") || n.includes("photovolt")) return TRADE_ICONS.solar;
  if (n.includes("lock") || n.includes("security")) return TRADE_ICONS.security;
  return TRADE_ICONS.default;
}

interface TradeAccordionProps {
  categories: Array<{ id: string; label: string; trades: string[] }>;
  customTrades: string[];
  selected: string[];
  search: string;
  onToggle: (t: string) => void;
}
=======

>>>>>>> a8a610c8d2c27f0efe9bbbbf6871afff876a3265

export function TradeAccordion({
  categories,
  customTrades,
  selected,
  search,
  onToggle,
}: TradeAccordionProps) {
  const q = search.trim().toLowerCase();
  // Single-open accordion — opening a category collapses the previous one.
  const [openId, setOpenId] = useState<string | null>(() => categories[0]?.id ?? null);

  const groups = useMemo(() => {
    const base = categories.map((c) => ({ ...c }));
    if (customTrades.length > 0) {
      base.push({ id: "cat-custom", label: "Your custom trades", trades: [...customTrades] });
    }
    if (!q) return base;
    return base
      .map((c) => ({ ...c, trades: c.trades.filter((t) => t.toLowerCase().includes(q)) }))
      .filter((c) => c.trades.length > 0);
  }, [categories, customTrades, q]);

  // Auto-open all categories that match search
  useEffect(() => {
    if (!q) return;
    // On search, snap to the first matching group so the layout stays compact.
    setOpenId(groups[0]?.id ?? null);
  }, [q, groups]);

  function toggleCat(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-slate-800 bg-[#0f172a]/70 px-4 py-6 text-center text-xs text-slate-400">
        No trades match your search. Press the “Add” button above to create a custom trade.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {groups.map((cat) => {
        const isOpen = openId === cat.id;
        const CatIcon = CATEGORY_ICONS[cat.id] ?? Wrench;
        return (
          <div
            key={cat.id}
            className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]/70"
          >
            <button
              type="button"
              onClick={() => toggleCat(cat.id)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-[#1e293b]/60"
              aria-expanded={isOpen}
            >
              <span className="flex min-w-0 items-center gap-2">
                <CatIcon className="size-4 shrink-0 text-orange-glow" />
                <span className="truncate text-sm font-semibold text-white">{cat.label}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {cat.trades.length} trades
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-slate-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-2 border-t border-slate-800/80 p-2 md:grid-cols-3">
                {cat.trades.map((t) => {
                  const isSelected = selected.includes(t);
                  const TIcon = iconForTrade(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onToggle(t)}
                      aria-pressed={isSelected}
                      className={cn(
                        "group relative flex flex-col gap-1.5 rounded-lg border-2 px-2.5 py-2 text-left transition-all",
                        isSelected
                          ? "border-[#f97316] bg-[#f97316]/10 text-white shadow-[0_0_20px_rgba(251,146,60,0.35)] ring-2 ring-orange/60"
                          : "border-slate-800 bg-[#1e293b] text-white hover:border-orange/60 hover:bg-[#1e293b]/90",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <TIcon
                          className={cn(
                            "size-4",
                            isSelected ? "text-orange-glow" : "text-slate-400",
                          )}
                        />
                        {isSelected && <CheckCircle2 className="size-4 text-orange-glow" />}
                      </span>
                      <span className={cn("text-sm font-semibold leading-snug text-white")}>
                        {t}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
