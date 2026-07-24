/**
 * IntakeProgress — compact step indicator shown at the top of HomeownerForm.
 * Reflects how many of the key sections the user has filled in, giving
 * lightweight visual feedback as they progress through the intake.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntakeStep = {
  label: string;
  done: boolean;
};

export function IntakeProgress({ steps }: { steps: IntakeStep[] }) {
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Your progress
        </p>
        <p className="text-xs font-semibold text-slate-200">
          {completed} <span className="text-slate-400">/ {steps.length}</span>
        </p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange to-orange-glow transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
              s.done
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.04] text-slate-400",
            )}
          >
            <span
              className={cn(
                "inline-flex size-3.5 items-center justify-center rounded-full text-[9px] font-bold",
                s.done ? "bg-emerald-400/80 text-emerald-950" : "bg-white/10 text-slate-300",
              )}
            >
              {s.done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
