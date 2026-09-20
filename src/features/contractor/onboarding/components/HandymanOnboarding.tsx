/**
 * HandymanOnboarding — single-page multi-step Trade Professional onboarding.
 *
 * Orchestrates the wizard state (fields, validation, step navigation, draft
 * persistence, submission) and composes the per-step UIs from
 * `./handyman/steps/*` plus the shared dialogs / navigation. Each sub-file
 * is presentational and receives only the state and callbacks it needs.
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { FormShell } from "@/components/shared/FormShell";
import { REGULATED_TRADES, TRADE_OPTIONS } from "@/regions";

import {
  EMAIL_RE,
  PHONE_RE,
  SECTIONS,
} from "@/features/contractor/onboarding/components/onboarding-constants";

import { supabase } from "@/integrations/supabase/client";
import { usePostcodeLookup } from "./handyman/hooks/usePostcodeLookup";
import { DRAFT_KEY, useOnboardingDraft } from "./handyman/hooks/useOnboardingDraft";
import { finalizeHandymanRegistration } from "./handyman/finalizeRegistration";
import { StepTracker } from "./handyman/StepTracker";
import { WizardFooterNav } from "./handyman/WizardFooterNav";
import { MeisterDialog } from "./handyman/MeisterDialog";
import { SecureAccountDialog } from "./handyman/SecureAccountDialog";
import { IdentityStep } from "./handyman/steps/IdentityStep";
import { TradesStep } from "./handyman/steps/TradesStep";
import { ServiceAreaStep } from "./handyman/steps/ServiceAreaStep";
import { ContactStep } from "./handyman/steps/ContactStep";
import { ProfileStep } from "./handyman/steps/ProfileStep";

export function HandymanOnboarding() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Trades
  const [trades, setTrades] = useState<string[]>([]);
  const [customTrades, setCustomTrades] = useState<string[]>([]);
  const [meisterTrade, setMeisterTrade] = useState<string | null>(null);
  const [tradeSearch, setTradeSearch] = useState("");

  // Service area
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [cityAutoFilled, setCityAutoFilled] = useState(false);
  const [stateName, setStateName] = useState("");
  const [, setStateAutoFilled] = useState(false);
  const [streetAddress, setStreetAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [radius, setRadius] = useState<number[]>([25]);

  // Contact
  const [businessEmail, setBusinessEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");

  // Profile
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [minProjectSize, setMinProjectSize] = useState<number>(1000);
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["en", "de"]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  // Postcode → city + state.
  usePostcodeLookup({
    postalCode,
    cityAutoFilled,
    setCity,
    setStateName,
    setCityAutoFilled,
    setStateAutoFilled,
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active || !data?.user) return;
        setAlreadySignedIn(true);
        setSessionEmail(data.user.email ?? null);
      } catch {
        /* not signed in */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sessionEmail) setBusinessEmail((cur) => cur || sessionEmail);
  }, [sessionEmail]);

  function toggleTrade(t: string) {
    setTrades((cur) => {
      const has = cur.includes(t);
      const next = has ? cur.filter((x) => x !== t) : [...cur, t];
      if (!has && REGULATED_TRADES.has(t)) {
        try {
          const KEY = "hw.meisterNoticeShown";
          if (typeof window !== "undefined" && !window.localStorage.getItem(KEY)) {
            window.localStorage.setItem(KEY, "1");
            setMeisterTrade(t);
          }
        } catch {
          /* storage unavailable — skip notice */
        }
      }
      return next;
    });
  }

  function toggleLanguage(code: string) {
    setLanguages((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }

  const allTrades = useMemo(() => [...TRADE_OPTIONS, ...customTrades], [customTrades]);
  const filteredTrades = useMemo(() => {
    const q = tradeSearch.trim().toLowerCase();
    if (!q) return allTrades;
    return allTrades.filter((t) => t.toLowerCase().includes(q));
  }, [tradeSearch, allTrades]);
  const noTradeMatches = tradeSearch.trim().length > 0 && filteredTrades.length === 0;

  function onTradeSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTrades.length > 0) {
        toggleTrade(filteredTrades[0]);
        setTradeSearch("");
      }
    }
  }

  // Live validation
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Enter your first name";
    if (lastName.trim().length < 2) e.lastName = "Enter your last name";
    if (trades.length === 0) e.trades = "Pick at least one trade";
    if (!/^\d{5}$/.test(postalCode)) e.postalCode = "5-digit German postcode";
    if (!city.trim()) e.city = "City is required";
    if (!streetAddress.trim()) e.streetAddress = "Street name required";
    if (!houseNumber.trim()) e.houseNumber = "House number required";
    if (!EMAIL_RE.test(businessEmail.trim())) e.businessEmail = "Enter a valid email";
    if (!PHONE_RE.test(mobilePhone.trim())) e.mobilePhone = "Enter a valid mobile number";
    return e;
  }, [
    firstName,
    lastName,
    trades,
    postalCode,
    city,
    streetAddress,
    houseNumber,
    businessEmail,
    mobilePhone,
  ]);

  // Multi-step wizard state
  const TOTAL_STEPS = 5;
  const [currentStep, setCurrentStep] = useState<number>(1);

  useOnboardingDraft(
    {
      firstName,
      lastName,
      businessName,
      trades,
      customTrades,
      postalCode,
      city,
      stateName,
      streetAddress,
      houseNumber,
      radius,
      businessEmail,
      mobilePhone,
      teamSize,
      minProjectSize,
      bio,
      languages,
      currentStep,
      avatarPreview,
    },
    {
      setFirstName,
      setLastName,
      setBusinessName,
      setTrades,
      setCustomTrades,
      setPostalCode,
      setCity,
      setStateName,
      setStreetAddress,
      setHouseNumber,
      setRadius,
      setBusinessEmail,
      setMobilePhone,
      setTeamSize,
      setMinProjectSize,
      setBio,
      setLanguages,
      setCurrentStep,
      setAvatarPreview,
    },
  );

  const safeStep =
    typeof currentStep === "number" && Number.isFinite(currentStep)
      ? Math.min(TOTAL_STEPS, Math.max(1, Math.floor(currentStep)))
      : 1;
  const progress = Math.round((safeStep / TOTAL_STEPS) * 100);

  const STEP_FIELDS: Record<number, string[]> = {
    1: ["firstName", "lastName"],
    2: ["trades"],
    3: ["postalCode", "city", "streetAddress", "houseNumber"],
    4: ["businessEmail", "mobilePhone"],
    5: [],
  };

  function validateStep(step: number): string | null {
    const fields = STEP_FIELDS?.[step] ?? [];
    for (const f of fields) {
      if (errors?.[f]) return errors[f];
    }
    return null;
  }

  function goNext() {
    const fields = STEP_FIELDS[currentStep] ?? [];
    setTouched((t) => {
      const next = { ...t };
      fields.forEach((f) => (next[f] = true));
      return next;
    });
    const firstError = validateStep(currentStep);
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goPrev() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function goToStep(step: number) {
    setCurrentStep(Math.min(TOTAL_STEPS, Math.max(1, step)));
  }

  function prefillDemo() {
    setFirstName("Lukas");
    setLastName("Müller");
    setBusinessName("Müller Bau GmbH");
    setTrades(["Carpentry & Timber Framing", "General Handyman & Assembly Services"]);
    setPostalCode("68159");
    setStreetAddress("Friedrichsring");
    setHouseNumber("12");
    setBusinessEmail("lukas.mueller@example.de");
    setMobilePhone("0176 1234 5678");
    setRadius([40]);
    setTeamSize(5);
    setMinProjectSize(2500);
    setBio(
      "20+ years of carpentry and general handyman work across Mannheim and the Rhein-Neckar region. Specialised in extensions, loft conversions and bespoke timber framing.",
    );
    setLanguages(["en", "de"]);
    setTouched({
      firstName: true,
      lastName: true,
      trades: true,
      postalCode: true,
      city: true,
      streetAddress: true,
      houseNumber: true,
      businessEmail: true,
      mobilePhone: true,
    });
    toast.success("Demo data loaded", {
      description: "All fields prefilled — review and submit.",
    });
  }

  function validateAllAndScroll(): boolean {
    setTouched({
      firstName: true,
      lastName: true,
      trades: true,
      postalCode: true,
      city: true,
      streetAddress: true,
      houseNumber: true,
      businessEmail: true,
      mobilePhone: true,
    });
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      toast.error(errors[firstError]);
      const sectionOf: Record<string, string> = {
        firstName: "identity",
        lastName: "identity",
        trades: "trades",
        postalCode: "area",
        city: "area",
        streetAddress: "area",
        houseNumber: "area",
        businessEmail: "contact",
        mobilePhone: "contact",
      };
      const stepOf: Record<string, number> = {
        identity: 1,
        trades: 2,
        area: 3,
        contact: 4,
        profile: 5,
      };
      const targetSection = sectionOf[firstError] ?? "identity";
      goToStep(stepOf[targetSection] ?? 1);
      setTimeout(() => {
        const el = document.getElementById(firstError) as HTMLElement | null;
        try {
          el?.focus({ preventScroll: true });
        } catch {
          /* focus can throw when the element was unmounted */
        }
      }, 200);
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Only the explicit "Finish" button opens the password modal.
  }

  function openPasswordModal() {
    if (!validateAllAndScroll()) return;
    // Already signed in? Save straight onto the current account — never ask an
    // existing user to create a second one.
    if (alreadySignedIn) {
      void finalizeRegistration();
      return;
    }
    setPwOpen(true);
  }

  async function finalizeRegistration() {
    if (!alreadySignedIn && pw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { signedIn, error } = await finalizeHandymanRegistration(
      {
        firstName,
        lastName,
        businessName,
        businessEmail,
        mobilePhone,
        streetAddress,
        houseNumber,
        postalCode,
        city,
        stateName,
        teamSize: Number(teamSize) || 1,
        minProjectSize: Number(minProjectSize) || 1000,
        bio,
        languages,
        trades,
        radiusKm: radius[0] ?? 25,
        avatarDataUrl: avatarPreview ?? null,
      },
      alreadySignedIn ? null : pw,
    );
    if (error) {
      toast.error(error);
    }

    setPwOpen(false);
    setSubmitting(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }

    if (signedIn) {
      toast.success("You're signed in. Opening your profile…");
      await navigate({ to: "/contractor/profile", replace: true });
    } else {
      toast.info("Profile saved. Please check your email to verify your account.", {
        duration: 10000,
      });
      await navigate({ to: "/login", replace: true });
    }
  }

  // Suppress unused-value lint on lookup handles kept for backward-compat.
  useEffect(() => void safeStep, [safeStep]);

  return (
    <FormShell
      eyebrow="Profile · Trade Professional"
      title="Set up your professional profile"
      subtitle="Tell clients who you are, what you do, where you work and how to reach you."
    >
      <StepTracker
        currentStep={currentStep}
        progress={progress}
        onGoToStep={goToStep}
        onPrefillDemo={prefillDemo}
      />

      <TooltipProvider delayDuration={150}>
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const target = e.target as HTMLElement;
            if (target.tagName === "TEXTAREA") return;
            if ((e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) return;
            if (target.tagName === "BUTTON") return;
            e.preventDefault();
            if (currentStep < TOTAL_STEPS) {
              goNext();
            } else {
              openPasswordModal();
            }
          }}
          className="space-y-2"
        >
          {currentStep === 1 && (
            <IdentityStep
              firstName={firstName}
              lastName={lastName}
              businessName={businessName}
              errors={errors}
              touched={touched}
              onTouch={touch}
              setFirstName={setFirstName}
              setLastName={setLastName}
              setBusinessName={setBusinessName}
            />
          )}

          {currentStep === 2 && (
            <TradesStep
              trades={trades}
              customTrades={customTrades}
              tradeSearch={tradeSearch}
              setTradeSearch={setTradeSearch}
              onSearchKey={onTradeSearchKey}
              onToggleTrade={toggleTrade}
              onTouch={touch}
              errors={errors}
              touched={touched}
              noTradeMatches={noTradeMatches}
            />
          )}

          {currentStep === 3 && (
            <ServiceAreaStep
              postalCode={postalCode}
              city={city}
              stateName={stateName}
              streetAddress={streetAddress}
              houseNumber={houseNumber}
              radius={radius}
              cityAutoFilled={cityAutoFilled}
              errors={errors}
              touched={touched}
              onTouch={touch}
              setPostalCode={setPostalCode}
              setCity={setCity}
              setStateName={setStateName}
              setCityAutoFilled={setCityAutoFilled}
              setStateAutoFilled={setStateAutoFilled}
              setStreetAddress={setStreetAddress}
              setHouseNumber={setHouseNumber}
              setRadius={setRadius}
            />
          )}

          {currentStep === 4 && (
            <ContactStep
              businessEmail={businessEmail}
              mobilePhone={mobilePhone}
              errors={errors}
              touched={touched}
              onTouch={touch}
              setBusinessEmail={setBusinessEmail}
              setMobilePhone={setMobilePhone}
            />
          )}

          {currentStep === 5 && (
            <ProfileStep
              avatarPreview={avatarPreview}
              teamSize={teamSize}
              minProjectSize={minProjectSize}
              bio={bio}
              languages={languages}
              setAvatarPreview={setAvatarPreview}
              setTeamSize={setTeamSize}
              setMinProjectSize={setMinProjectSize}
              setBio={(updater) => setBio((cur) => updater(cur))}
              setBioValue={setBio}
              onToggleLanguage={toggleLanguage}
            />
          )}

          <WizardFooterNav
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            submitting={submitting}
            onPrev={goPrev}
            onNext={goNext}
            onFinish={openPasswordModal}
          />
        </form>
      </TooltipProvider>

      <MeisterDialog trade={meisterTrade} onClose={() => setMeisterTrade(null)} />

      <SecureAccountDialog
        open={pwOpen}
        onOpenChange={setPwOpen}
        submitting={submitting}
        password={pw}
        setPassword={setPw}
        showPw={showPw}
        setShowPw={(updater) => setShowPw((v) => updater(v))}
        onFinalize={() => void finalizeRegistration()}
      />
    </FormShell>
  );
}

export default HandymanOnboarding;

// Backward-compat re-exports for existing importers.
export {
  AVAILABLE_LANGUAGES,
  CARD_CLS,
  HEADER_CLS,
} from "@/features/contractor/onboarding/components/onboarding-constants";
// SECTIONS is re-exported so any consumer importing it from the old path continues to work.
export { SECTIONS };
