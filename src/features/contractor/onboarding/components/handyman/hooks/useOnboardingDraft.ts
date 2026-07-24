/**
 * useOnboardingDraft — persist every text field of the Handyman onboarding
 * wizard across refreshes. Debounced writes; SSR-safe read on mount.
 * Exported constant `DRAFT_KEY` so the caller can clear the draft after a
 * successful submission.
 */
import { useEffect, useRef } from "react";

export const DRAFT_KEY = "hw.handymanOnboarding.draft.v1";

export interface DraftState {
  firstName: string;
  lastName: string;
  businessName: string;
  trades: string[];
  customTrades: string[];
  postalCode: string;
  city: string;
  stateName: string;
  streetAddress: string;
  houseNumber: string;
  radius: number[];
  businessEmail: string;
  mobilePhone: string;
  teamSize: number;
  minProjectSize: number;
  bio: string;
  languages: string[];
  currentStep: number;
  avatarPreview: string | null;
}

export interface DraftSetters {
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
  setTrades: (v: string[]) => void;
  setCustomTrades: (v: string[]) => void;
  setPostalCode: (v: string) => void;
  setCity: (v: string) => void;
  setStateName: (v: string) => void;
  setStreetAddress: (v: string) => void;
  setHouseNumber: (v: string) => void;
  setRadius: (v: number[]) => void;
  setBusinessEmail: (v: string) => void;
  setMobilePhone: (v: string) => void;
  setTeamSize: (v: number) => void;
  setMinProjectSize: (v: number) => void;
  setBio: (v: string) => void;
  setLanguages: (v: string[]) => void;
  setCurrentStep: (v: number) => void;
  setAvatarPreview: (v: string | null) => void;
}

export function useOnboardingDraft(state: DraftState, setters: DraftSetters) {
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (typeof d.firstName === "string") setters.setFirstName(d.firstName);
      if (typeof d.lastName === "string") setters.setLastName(d.lastName);
      if (typeof d.businessName === "string") setters.setBusinessName(d.businessName);
      if (Array.isArray(d.trades)) setters.setTrades(d.trades as string[]);
      if (Array.isArray(d.customTrades)) setters.setCustomTrades(d.customTrades as string[]);
      if (typeof d.postalCode === "string") setters.setPostalCode(d.postalCode);
      if (typeof d.city === "string") setters.setCity(d.city);
      if (typeof d.stateName === "string") setters.setStateName(d.stateName);
      if (typeof d.streetAddress === "string") setters.setStreetAddress(d.streetAddress);
      if (typeof d.houseNumber === "string") setters.setHouseNumber(d.houseNumber);
      if (Array.isArray(d.radius) && typeof d.radius[0] === "number")
        setters.setRadius(d.radius as number[]);
      if (typeof d.businessEmail === "string") setters.setBusinessEmail(d.businessEmail);
      if (typeof d.mobilePhone === "string") setters.setMobilePhone(d.mobilePhone);
      if (typeof d.teamSize === "number") setters.setTeamSize(d.teamSize);
      if (typeof d.minProjectSize === "number") setters.setMinProjectSize(d.minProjectSize);
      if (typeof d.bio === "string") setters.setBio(d.bio);
      if (Array.isArray(d.languages)) setters.setLanguages(d.languages as string[]);
      if (typeof d.currentStep === "number") setters.setCurrentStep(d.currentStep);
      if (typeof d.avatarPreview === "string") setters.setAvatarPreview(d.avatarPreview);
    } catch {
      /* corrupted draft — ignore */
    } finally {
      draftLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftLoadedRef.current) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      } catch {
        /* quota exceeded — skip */
      }
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.firstName,
    state.lastName,
    state.businessName,
    state.trades,
    state.customTrades,
    state.postalCode,
    state.city,
    state.stateName,
    state.streetAddress,
    state.houseNumber,
    state.radius,
    state.businessEmail,
    state.mobilePhone,
    state.teamSize,
    state.minProjectSize,
    state.bio,
    state.languages,
    state.currentStep,
    state.avatarPreview,
  ]);
}
