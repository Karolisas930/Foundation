/**
 * HomeownerForm — 3-step wizard coordinator for the private-client onboarding
 * + project intake flow. Owns top-level form state and submission; renders
 * focused step sub-components from `./homeowner-form/*`. Successful
 * submissions hand off to <SuccessScreen />.
 *
 * Sub-steps are kept mounted via `hidden` so uncontrolled inputs never lose
 * typed data when navigating Back/Next. Submission logic (ledger writes,
 * Supabase signUp, jobs insert, ConfirmPostDialog) is preserved verbatim.
 */
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { FormShell } from "@/components/shared/FormShell";
import { TopBar } from "@/components/shared/TopBar";

import {
  getEcosystemLedger,
  startDemoSession,
  updateEcosystemLedger,
  type EcosystemProject,
} from "@/core/demo-session";
import { persistOnboardingProfile } from "@/components/shared/shared";
import { supabase } from "@/integrations/supabase/client";
import { savePendingProject } from "@/lib/pending-projects.functions";

import { type TradeDetails } from "@/features/homeowner/jobs/post-project/parts";
import {
  formatProjectLanguages,
  type ProjectLanguageCode,
} from "@/features/homeowner/jobs/post-project/project-language";

import { ConfirmPostDialog } from "@/features/homeowner/jobs/post-project/ConfirmPostDialog";
import {
  SuccessScreen,
  type SuccessState,
} from "@/features/homeowner/jobs/post-project/SuccessScreen";

import { ProjectStep } from "./homeowner-form/ProjectStep";
import { ContactStep } from "./homeowner-form/ContactStep";
import { DetailsStep } from "./homeowner-form/DetailsStep";
import { WizardProgress } from "./homeowner-form/WizardProgress";
import { WizardNav } from "./homeowner-form/WizardNav";

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Project", "Contact", "Details"] as const;

export function HomeownerForm() {
  const savePendingProjectFn = useServerFn(savePendingProject);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Project fields
  const [projectTitle, setProjectTitle] = useState("");
  const [trade, setTrade] = useState<string>("");
  const [tradeDetails, setTradeDetails] = useState<TradeDetails>({});
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState<number>(5000);
  const [timeline, setTimeline] = useState<string>("");

  const [projectLanguages, setProjectLanguages] = useState<ProjectLanguageCode[]>(["de"]);
  const [customLanguage, setCustomLanguage] = useState("");
  const [consent, setConsent] = useState(false);

  // Address (controlled so DE/BW postcode lookup can auto-fill city)
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [cityAutoFilled, setCityAutoFilled] = useState(false);

  // AI spec: voice memo + media
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  // ---- Per-step validation ---------------------------------------------
  function validateStep(step: number): boolean {
    if (step === 1) {
      if (projectTitle.trim().length < 4) {
        toast.error("Please enter a project title (min. 4 characters).");
        return false;
      }
      if (!trade) {
        toast.error("Please pick the trade you need.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      const form = formRef.current;
      if (!form) return false;
      const fd = new FormData(form);
      const fullName = String(fd.get("fullName") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const streetName = String(fd.get("streetName") ?? "").trim();
      const houseNumber = String(fd.get("houseNumber") ?? "").trim();
      const mobile = String(fd.get("mobile") ?? "").trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!fullName) return (toast.error("Please enter your full name."), false);
      if (!emailOk) return (toast.error("Please enter a valid email address."), false);
      if (!streetName) return (toast.error("Please enter your street name."), false);
      if (!houseNumber) return (toast.error("Please enter your house number."), false);
      if (!mobile || mobile.replace(/\D/g, "").length < 6)
        return (toast.error("Please enter your phone number."), false);
      if (postalCode.trim().length < 4)
        return (toast.error("Please enter your postal code."), false);
      return true;
    }
    if (step === 3) {
      if (!consent) {
        toast.error("Please accept the privacy notice to continue.");
        return false;
      }
      return true;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function validateAndOpenConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep !== TOTAL_STEPS) return;
    if (!validateStep(TOTAL_STEPS)) return;
    setConfirmOpen(true);
  }

  async function performSubmit() {
    setConfirmOpen(false);
    if (!formRef.current) return;
    if (!consent) {
      toast.error("Please accept the privacy notice to continue.");
      return;
    }
    const fd = new FormData(formRef.current);

    const profile = {
      fullName: String(fd.get("fullName") ?? "").trim(),
      email: String(fd.get("email") ?? "")
        .trim()
        .toLowerCase(),
      mobile: String(fd.get("mobile") ?? "").trim(),
      street: String(fd.get("street") ?? "").trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
    };

    setSubmitting(true);

    const seekerId = persistOnboardingProfile("homeowner", {
      ...profile,
      hasVoiceMemo: Boolean(audioUrl),
      tradeDetails,
      preferredLanguages: projectLanguages,
      customLanguage: customLanguage.trim() || undefined,
      consentAcceptedAt: new Date().toISOString(),
    });

    const ledger = getEcosystemLedger();
    const newProject: EcosystemProject = {
      id: `PROJ-${Date.now()}`,
      seekerId,
      title: projectTitle.trim(),
      description: notes.trim() || `${trade} request from ${profile.city || "homeowner"}.`,
      locationZip: profile.postalCode || "00000",
      phase: "Planung",
      status: "open",
      budgetTotal: budget,
      budgetUsed: 0,
      trade,
      city: profile.city,
      mediaUrls: mediaFiles.map((f) => URL.createObjectURL(f)),
      voiceTranscript: audioUrl ? notes.trim() || "AI voice brief captured." : undefined,
      desiredStart: timeline || undefined,
      language: formatProjectLanguages(projectLanguages, customLanguage),
    };
    ledger.projects = [...(ledger.projects ?? []), newProject];

    // No fabricated bids here any more: real bids come from the database
    // (see src/lib/job-bids.functions.ts) once contractors actually quote.

    updateEcosystemLedger(ledger);
    startDemoSession("homeowner");

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const ownerId = userRes.user?.id;
      if (ownerId) {
        const { data: jobRow, error: jobErr } = await supabase
          .from("jobs")
          .insert({
            owner_id: ownerId,
            title: newProject.title,
            description: newProject.description,
            trade: trade || null,
            estimated_budget: budget,
            location_zip: profile.postalCode || null,
            city: profile.city || null,
            language: newProject.language ?? null,
            urgency: timeline === "asap" ? "urgent" : "normal",
            status: "open",
          })
          .select("id")
          .single();
        if (jobErr) {
          toast.warning(
            `Project saved locally, but couldn't reach the matching feed (${jobErr.message}).`,
          );
        } else if (jobRow?.id) {
          newProject.id = jobRow.id;
          updateEcosystemLedger(ledger);
        }
      } else {
        // No account yet - this is the common case for a brand-new guest.
        // Save server-side (keyed by email) so it can be claimed into the
        // real jobs table once they actually confirm an account, from
        // whatever tab/device that confirmation happens on. See
        // src/lib/pending-projects.functions.ts and /auth/callback.
        try {
          await savePendingProjectFn({
            data: {
              email: profile.email,
              title: newProject.title,
              description: newProject.description,
              trade: trade || undefined,
              estimatedBudget: budget,
              locationZip: profile.postalCode || undefined,
              city: profile.city || undefined,
              language: newProject.language ?? undefined,
              urgency: timeline === "asap" ? "urgent" : "normal",
            },
          });
        } catch (pendingErr) {
          // Loud on purpose: if this fails there is nothing for
          // claim_pending_projects() to attach after email confirmation, and
          // the new account's dashboard shows "No projects yet".
          console.error("[pending-projects] guest save failed", pendingErr);
          toast.error(
            `We couldn't store "${newProject.title}" for your new account${
              pendingErr instanceof Error ? ` (${pendingErr.message})` : ""
            }. Please post it again once you're signed in.`,
            { duration: 12000 },
          );
        }
      }
    } catch (err) {
      toast.warning(
        `Project saved locally — matching feed sync will retry later${
          err instanceof Error ? ` (${err.message})` : ""
        }.`,
      );
    }

    toast.success(`"${newProject.title}" is live — check your inbox to sign in.`);
    setSuccess({
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.mobile,
      project: newProject,
      mediaCount: mediaFiles.length,
      hasVoice: Boolean(audioUrl),
    });
    setSubmitting(false);
  }

  if (success) return <SuccessScreen success={success} />;

  const percent = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <>
      <FormShell
        eyebrow="Homeowner · Project intake"
        title="Good work starts with the right people."
        subtitle="Specify what needs doing, your location, details, and project timeframe."
      >
        <WizardProgress
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          percent={percent}
        />

        <form
          ref={formRef}
          onSubmit={validateAndOpenConfirm}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const target = e.target as HTMLElement;
            if (target.tagName === "TEXTAREA") return;
            if (target.tagName === "BUTTON") return;
            if ((e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) return;
            if (currentStep < TOTAL_STEPS) {
              e.preventDefault();
              goNext();
            }
          }}
          className="mt-6 space-y-4"
        >
          <div hidden={currentStep !== 1}>
            <ProjectStep
              projectTitle={projectTitle}
              setProjectTitle={setProjectTitle}
              trade={trade}
              setTrade={setTrade}
              tradeDetails={tradeDetails}
              setTradeDetails={setTradeDetails}
              notes={notes}
              setNotes={setNotes}
              budget={budget}
              setBudget={setBudget}
              timeline={timeline}
              setTimeline={setTimeline}
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              city={city}
              setCity={setCity}
              setAudioUrl={setAudioUrl}
            />
          </div>

          <div hidden={currentStep !== 2}>
            <ContactStep
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              city={city}
              setCity={setCity}
              cityAutoFilled={cityAutoFilled}
              setCityAutoFilled={setCityAutoFilled}
            />
          </div>

          <div hidden={currentStep !== 3}>
            <DetailsStep
              mediaFiles={mediaFiles}
              setMediaFiles={setMediaFiles}
              notes={notes}
              setNotes={setNotes}
              budget={budget}
              setBudget={setBudget}
              timeline={timeline}
              setTimeline={setTimeline}
              projectLanguages={projectLanguages}
              setProjectLanguages={setProjectLanguages}
              customLanguage={customLanguage}
              setCustomLanguage={setCustomLanguage}
              consent={consent}
              setConsent={setConsent}
            />
          </div>

          {/* Hidden submit target so requestSubmit() still triggers full form validation. */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />

          <WizardNav
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            percent={percent}
            submitting={submitting}
            consent={consent}
            onBack={goBack}
            onNext={goNext}
            onSubmit={() => formRef.current?.requestSubmit()}
          />
        </form>
      </FormShell>

      <ConfirmPostDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        submitting={submitting}
        onConfirm={() => void performSubmit()}
        projectTitle={projectTitle}
        trade={trade}
        city={city}
        postalCode={postalCode}
        budget={budget}
        startDate=""
        timeline={timeline}
        projectLanguages={projectLanguages}
        customLanguage={customLanguage}
      />
    </>
  );
}

export default HomeownerForm;
