import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABELS, type StepIndex } from "./constants";

export function WizardHeader({ step, onBack }: { step: StepIndex; onBack: () => void }) {
  return (
    <header>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 hover:text-orange-glow"
        >
          <ArrowLeft className="size-3.5" />
          {step === 0 ? "Home" : "Back"}
        </button>
        <span className="chip-glow inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Step {step + 1} of 3
        </span>
      </div>

      <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        {step === 0 && (
          <>
            Which trade do you{" "}
            <span className="bg-gradient-to-r from-orange to-orange-glow bg-clip-text text-transparent">
              need?
            </span>
          </>
        )}
        {step === 1 && (
          <>
            Where is the{" "}
            <span className="bg-gradient-to-r from-orange to-orange-glow bg-clip-text text-transparent">
              project?
            </span>
          </>
        )}
        {step === 2 && (
          <>
            What's your{" "}
            <span className="bg-gradient-to-r from-orange to-orange-glow bg-clip-text text-transparent">
              budget?
            </span>
          </>
        )}
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
        {step === 0 && "Pick the closest fit. Trades can clarify scope with you afterwards."}
        {step === 1 &&
          "Enter your 5-digit German postal code (PLZ). We'll match local trades in your area."}
        {step === 2 && "A rough size is enough — this only helps trades decide if it's a good fit."}
      </p>

      <ProgressBar step={step} />
    </header>
  );
}

function ProgressBar({ step }: { step: StepIndex }) {
  return (
    <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Wizard progress">
      {STEP_LABELS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                done && "bg-orange",
                active && "bg-gradient-to-r from-orange to-orange-glow",
                !done && !active && "bg-white/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em]",
                active ? "text-orange-glow" : "text-slate-500",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
