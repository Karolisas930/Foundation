import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface WizardNavProps {
  currentStep: number;
  totalSteps: number;
  percent: number;
  submitting: boolean;
  consent: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNav({
  currentStep,
  totalSteps,
  percent,
  submitting,
  consent,
  onBack,
  onNext,
  onSubmit,
}: WizardNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-800/80 bg-[#0f172a]/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] sm:static sm:mt-6 sm:rounded-2xl sm:border sm:border-slate-800/80 sm:bg-[#1e293b]/60 sm:px-4 sm:py-3 sm:shadow-xl sm:backdrop-blur-0">
      <Button
        type="button"
        variant="outline"
        disabled={currentStep === 1 || submitting}
        onClick={onBack}
        className="h-12 rounded-full border-slate-600 bg-transparent px-5 text-slate-200 hover:bg-slate-800 disabled:opacity-40 sm:h-11"
      >
        <ArrowLeft className="mr-1.5 size-4" />
        Back
      </Button>

      <div className="hidden text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:block">
        {percent}% complete
      </div>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="btn-glow btn-glow-hover h-12 flex-1 rounded-full px-6 font-semibold sm:h-11 sm:flex-none"
        >
          Next
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          disabled={submitting || !consent}
          onClick={onSubmit}
          className="btn-glow btn-glow-hover h-12 flex-1 rounded-full px-6 font-semibold disabled:opacity-60 sm:h-11 sm:flex-none"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Posting…
            </span>
          ) : (
            "Review & post"
          )}
        </Button>
      )}
    </div>
  );
}
