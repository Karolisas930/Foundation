/**
 * PostJobWizard — 3-step, modal-style posting funnel that lives behind the
 * landing hero's "Post your project" CTA. Feeds the Matching Filter Engine
 * (src/lib/matching-engine.ts + src/lib/lead-dispatch.ts) by appending a
 * fully-shaped EcosystemProject to the demo ledger, so the hidden
 * `estimatedBudget >= minProjectSize` classifier fires immediately for every
 * contractor whose dashboard/notifications loader dispatches next.
 *
 * This file is a thin coordinator. The step UIs, the constants catalogue,
 * the header/progress panel and the step-validation hook live in
 * ./homeowner-wizard/*.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/shared/TopBar";
import {
  getEcosystemLedger,
  startDemoSession,
  updateEcosystemLedger,
  DEMO_CONTRACTOR_PROFILE_IDS,
  type EcosystemProject,
} from "@/core/demo-session";

import { type StepIndex, type WizardState } from "./homeowner-wizard/constants";
import { useWizardStep } from "./homeowner-wizard/useWizardStep";
import { WizardHeader } from "./homeowner-wizard/WizardHeader";
import { CategoryStep } from "./homeowner-wizard/CategoryStep";
import { LocationStep } from "./homeowner-wizard/LocationStep";
import { BudgetStep } from "./homeowner-wizard/BudgetStep";

export function PostJobWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>({
    categoryId: null,
    postalCode: "",
    budgetId: null,
  });

  const { category, budget, postcodeHit, canAdvance } = useWizardStep(state, step);

  function next() {
    if (!canAdvance) return;
    if (step < 2) setStep((s) => (s + 1) as StepIndex);
    else void submit();
  }

  function back() {
    if (step === 0) {
      void navigate({ to: "/" });
    } else {
      setStep((s) => (s - 1) as StepIndex);
    }
  }

  async function submit() {
    if (!category || !budget) return;
    setSubmitting(true);

    // Build the project payload. `budgetTotal` is what the pure Matching
    // Filter Engine reads as `estimatedBudget`, so the hidden minimum
    // project-size threshold fires the moment this project hits the ledger.
    const now = Date.now();
    const project: EcosystemProject = {
      id: `PROJ-${now}`,
      title: `${category.label} project`,
      description: `New ${category.label.toLowerCase()} request from ${postcodeHit?.city ?? "homeowner"} (${state.postalCode}).`,
      locationZip: state.postalCode,
      city: postcodeHit?.city,
      phase: "Planung",
      status: "open",
      budgetTotal: budget.value,
      budgetUsed: 0,
      trade: category.trade,
      language: "🇩🇪 Deutsch",
    };

    try {
      const ledger = getEcosystemLedger();
      ledger.projects = [...(ledger.projects ?? []), project];
      // Seed one placeholder proposal so the homeowner dashboard has signal
      // of the matching engine having dispatched the lead.
      const bidBase = Math.max(400, Math.round(budget.value * 0.7));
      ledger.proposals = [
        ...(ledger.proposals ?? []),
        {
          id: `BID-${now}-A`,
          projectId: project.id,
          company: "Müller Trockenbau GmbH",
          city: postcodeHit?.city ?? "Mannheim",
          rating: 4.9,
          labor: Math.round(bidBase * 0.55),
          materials: Math.round(bidBase * 0.35),
          travel: Math.round(bidBase * 0.05),
          postedAt: "just now",
          profileId: DEMO_CONTRACTOR_PROFILE_IDS.mueller,
        },
      ];
      updateEcosystemLedger(ledger);
      startDemoSession("homeowner");
    } catch (err) {
      console.error(err);
      toast.error("We couldn't save your project locally. Please try again.");
      setSubmitting(false);
      return;
    }

    toast.success(`"${project.title}" posted — matching trades now.`);
    void navigate({ to: "/homeowner", replace: true });
  }

  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid pb-24 text-slate-50">
      <TopBar />

      <section className="mx-auto max-w-2xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <WizardHeader step={step} onBack={back} />

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#1e293b]/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          {step === 0 && (
            <CategoryStep
              selectedId={state.categoryId}
              onSelect={(id) => setState((s) => ({ ...s, categoryId: id }))}
              onAdvance={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <LocationStep
              value={state.postalCode}
              onChange={(v) => setState((s) => ({ ...s, postalCode: v }))}
              city={postcodeHit?.city ?? null}
              onAdvance={next}
            />
          )}

          {step === 2 && (
            <BudgetStep
              selectedId={state.budgetId}
              onSelect={(id) => setState((s) => ({ ...s, budgetId: id }))}
            />
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            className="h-11 rounded-full px-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white sm:w-auto"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            {step === 0 ? "Back to home" : "Back"}
          </Button>

          <Button
            type="button"
            disabled={!canAdvance || submitting}
            onClick={next}
            className="btn-glow btn-glow-hover h-12 w-full rounded-full px-6 text-sm font-semibold disabled:opacity-50 sm:w-auto"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Matching…
              </span>
            ) : step < 2 ? (
              <>
                Continue <ArrowRight className="ml-1.5 size-4" />
              </>
            ) : (
              <>
                Post project <Check className="ml-1.5 size-4" />
              </>
            )}
          </Button>
        </div>

        <p className="mt-6 text-center text-[11px] font-medium tracking-wide text-slate-400">
          Free to post · Verified BW trades respond within 24h · GDPR-safe
        </p>
      </section>
    </main>
  );
}

export default PostJobWizard;
