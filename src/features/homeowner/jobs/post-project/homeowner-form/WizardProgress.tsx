export interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: readonly string[];
  percent: number;
}

export function WizardProgress({
  currentStep,
  totalSteps,
  stepLabels,
  percent,
}: WizardProgressProps) {
  return (
    <div className="sticky top-14 z-30 -mx-4 mt-5 border-b border-slate-800/60 bg-[#0f172a]/95 px-4 py-3 backdrop-blur sm:static sm:top-auto sm:z-auto sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:border-slate-800/80 sm:bg-[#1e293b]/70 sm:p-4 sm:shadow-xl sm:backdrop-blur-0">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
        <span>
          Step {currentStep} of {totalSteps} · {stepLabels[currentStep - 1]}
        </span>
        <span className="text-orange-glow">{percent}%</span>
      </div>
      <div className="mt-3 flex gap-2">
        {stepLabels.map((label, i) => {
          const idx = i + 1;
          const active = idx === currentStep;
          const done = idx < currentStep;
          return (
            <div
              key={label}
              className={[
                "h-2 flex-1 rounded-full transition-all",
                done
                  ? "bg-gradient-to-r from-orange to-orange-glow"
                  : active
                    ? "bg-orange/70 shadow-[0_0_12px_rgba(251,146,60,0.5)]"
                    : "bg-slate-700/70",
              ].join(" ")}
              aria-label={`${label} ${done ? "complete" : active ? "in progress" : "pending"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
