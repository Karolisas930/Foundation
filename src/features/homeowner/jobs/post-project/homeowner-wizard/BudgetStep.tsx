import { Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUDGETS } from "./constants";

export function BudgetStep({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUDGETS.map((b) => {
          const active = selectedId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              className={cn(
                "group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                "border-white/10 bg-white/[0.03] hover:border-orange/40 hover:bg-white/[0.06]",
                active && "border-orange/70 bg-orange/10",
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-orange/60 bg-orange/20 text-orange-glow"
                    : "border-white/10 bg-white/[0.04] text-slate-300 group-hover:text-orange-glow",
                )}
              >
                <Wallet className="size-4" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-base font-bold text-white">{b.label}</span>
                <span className="block text-[11px] leading-4 text-slate-400">{b.hint}</span>
              </span>
              {active && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-orange text-white">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
