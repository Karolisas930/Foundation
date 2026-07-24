/**
 * StepTracker — sticky top bar showing "Step X of N", prefill-demo button,
 * live percentage, and clickable segmented progress. Purely presentational;
 * receives current step + a click handler from the wizard.
 */
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/features/contractor/onboarding/components/onboarding-constants";

interface Props {
  currentStep: number;
  progress: number;
  onGoToStep: (step: number) => void;
  onPrefillDemo: () => void;
}

export function StepTracker({ currentStep, progress, onGoToStep, onPrefillDemo }: Props) {
  return (
    <div className="sticky top-[57px] z-20 -mx-5 mb-6 border-b border-white/10 bg-[#0f172a]/90 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="chip-glow inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Step {currentStep} of {SECTIONS.length}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPrefillDemo}
            title="Fill every field with realistic demo data"
            className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-glow transition hover:bg-orange/20"
          >
            <Sparkles className="h-3 w-3" /> Prefill demo
          </button>
          <span className="text-xs font-semibold text-white tabular-nums">{progress}%</span>
        </div>
      </div>
      <ol
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${SECTIONS.length}, minmax(0, 1fr))` }}
        aria-label="Onboarding progress"
      >
        {SECTIONS.map((s, i) => {
          const done = i < currentStep - 1;
          const active = i === currentStep - 1;
          return (
            <li key={s.id} className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onGoToStep(i + 1)}
                aria-label={`Go to ${s.label}`}
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  done && "bg-orange",
                  active && "bg-gradient-to-r from-orange to-orange-glow",
                  !done && !active && "bg-white/10 hover:bg-white/20",
                )}
              />
              <span
                className={cn(
                  "truncate text-[10px] font-bold uppercase tracking-[0.2em]",
                  active ? "text-orange-glow" : done ? "text-slate-300" : "text-slate-500",
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
