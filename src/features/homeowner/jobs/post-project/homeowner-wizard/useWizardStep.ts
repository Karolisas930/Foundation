import { useMemo } from "react";
import { lookupGermanPostcode } from "@/regions";
import { BUDGETS, CATEGORIES, type StepIndex, type WizardState } from "./constants";

/**
 * Derives the selected category / budget / postcode lookup and computes
 * whether the current step is valid enough to advance. Pure derived state —
 * no side effects, safe to call from render.
 */
export function useWizardStep(state: WizardState, step: StepIndex) {
  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === state.categoryId) ?? null,
    [state.categoryId],
  );
  const budget = useMemo(
    () => BUDGETS.find((b) => b.id === state.budgetId) ?? null,
    [state.budgetId],
  );
  const postcodeHit = useMemo(
    () => (state.postalCode.length === 5 ? lookupGermanPostcode(state.postalCode) : null),
    [state.postalCode],
  );

  const canAdvance =
    (step === 0 && !!category) ||
    (step === 1 && state.postalCode.length === 5) ||
    (step === 2 && !!budget);

  return { category, budget, postcodeHit, canAdvance };
}
