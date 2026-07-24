/**
 * OnboardingWizard — canonical Trade Professional onboarding wizard.
 *
 * Orchestrates the multi-step onboarding flow (Identity → Trades →
 * ServiceArea → Contact → Profile), delegating each step's rendering to
 * the presentational sub-components under `./handyman/steps/*`. The
 * legacy two-step split (`QuickStartForm` + `CompleteProfileForm`) has
 * been folded into this single orchestrator; `HandymanOnboarding` is
 * preserved as a thin re-export for back-compat.
 */
export { HandymanOnboarding as OnboardingWizard } from "@/features/contractor/onboarding/components/HandymanOnboarding";
export { HandymanOnboarding as default } from "@/features/contractor/onboarding/components/HandymanOnboarding";
