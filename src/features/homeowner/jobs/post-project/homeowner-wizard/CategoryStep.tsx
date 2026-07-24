import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./constants";

export function CategoryStep({
  selectedId,
  onSelect,
  onAdvance,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdvance: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => {
          const active = selectedId === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id);
                // Small delay so the selection glow is visible before the
                // step transition feels natural.
                setTimeout(onAdvance, 180);
              }}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                "border-white/10 bg-white/[0.03] hover:border-orange/40 hover:bg-white/[0.06]",
                active && "border-orange/70 bg-orange/10 shadow-[0_0_0_1px_hsl(var(--orange)/0.5)]",
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-orange/60 bg-orange/20 text-orange-glow"
                    : "border-white/10 bg-white/[0.04] text-slate-300 group-hover:text-orange-glow",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold text-white">{c.label}</span>
              <span className="text-[11px] leading-4 text-slate-400">{c.hint}</span>
              {active && (
                <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-orange text-white">
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
