import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  BUDGET_OPTIONS,
  DISTANCE_OPTIONS,
  PILL_EMOJI,
  TRADE_OPTIONS,
  formatPillLabel,
  type PillId,
  type Prefs,
} from "./alerts-types";

export function AlertsFilterPill({
  id,
  prefs,
  setPrefs,
}: {
  id: PillId;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
            "border border-orange-glow/30 bg-orange-glow/10 text-orange-glow",
            "backdrop-blur-md transition hover:border-orange-glow/50 hover:bg-orange-glow/15",
            "active:scale-[0.97]",
          )}
        >
          <span aria-hidden className="text-sm leading-none">
            {PILL_EMOJI[id]}
          </span>
          <span>{formatPillLabel(id, prefs)}</span>
          <ChevronDown
            className="h-3 w-3 opacity-70 transition group-hover:opacity-100"
            strokeWidth={2.5}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-64 rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-slate-100 shadow-2xl"
      >
        {id === "trade" && (
          <div className="space-y-1">
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Trade focus
            </p>
            <ul className="max-h-64 space-y-0.5 overflow-y-auto">
              {TRADE_OPTIONS.map((t) => {
                const active = prefs.trade === t;
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        setPrefs({ ...prefs, trade: t });
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition",
                        active
                          ? "bg-orange-glow/15 text-orange-glow"
                          : "text-slate-200 hover:bg-white/5",
                      )}
                    >
                      <span>{t}</span>
                      {active && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {id === "distance" && (
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Distance radius
            </p>
            <div className="px-1 pt-2">
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={prefs.distanceKm}
                onChange={(e) => setPrefs({ ...prefs, distanceKm: Number(e.target.value) })}
                className="w-full accent-[color:var(--orange-glow,#ff8c28)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>1 km</span>
                <span className="font-bold text-orange-glow">{prefs.distanceKm} km</span>
                <span>100 km</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DISTANCE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, distanceKm: d })}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                    prefs.distanceKm === d
                      ? "bg-orange-glow/20 text-orange-glow ring-1 ring-orange-glow/40"
                      : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10",
                  )}
                >
                  {d} km
                </button>
              ))}
            </div>
          </div>
        )}

        {id === "budget" && (
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Budget threshold
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BUDGET_OPTIONS.map((b) => {
                const active = prefs.budgetEur === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setPrefs({ ...prefs, budgetEur: b });
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                      active
                        ? "bg-orange-glow/20 text-orange-glow ring-1 ring-orange-glow/40"
                        : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10",
                    )}
                  >
                    €{b.toLocaleString("de-DE")}+
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
