/**
 * WizardFooterNav — bottom Back / % complete / Next|Finish row shared by
 * every step of the Handyman onboarding wizard.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/features/contractor/onboarding/components/onboarding-constants";

interface Props {
  currentStep: number;
  totalSteps: number;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function WizardFooterNav({
  currentStep,
  totalSteps,
  submitting,
  onPrev,
  onNext,
  onFinish,
}: Props) {
  const isLast = currentStep >= totalSteps;
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onPrev}
        disabled={currentStep === 1 || submitting}
        className={cn(
          "h-11 rounded-full px-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white",
          currentStep === 1 && "invisible",
        )}
      >
        <ArrowLeft className="mr-1.5 size-4" />
        Back
      </Button>
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 tabular-nums">
        {Math.round((currentStep / SECTIONS.length) * 100)}% complete
      </span>
      {!isLast ? (
        <Button
          type="button"
          onClick={onNext}
          className="btn-glow btn-glow-hover h-12 rounded-full px-6 text-sm font-semibold"
        >
          Next <ArrowRight className="ml-1.5 size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onFinish}
          disabled={submitting}
          className="btn-glow btn-glow-hover h-12 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Finish"}
        </Button>
      )}
    </div>
  );
}
