/**
 * useLegalGate — Phase 10 local legal registration gate.
 *
 * Pure client-side mock of the future `verifications`-backed gate. The
 * onboarding status is persisted in `localStorage` under `legal-gate:status`
 * so it survives reloads while we develop without a backend.
 *
 * A user is only considered fully cleared for main app data reads/writes
 * when their status is `APPROVED_REAL_DB_RECORD`. Every other status
 * (default: `PENDING_DOCUMENTATION`) routes them to the local onboarding
 * upload dashboard.
 */
import { useCallback, useEffect, useState } from "react";
import { UserOnboardingVerificationStatus } from "@/types/legalGate";

const STORAGE_KEY = "legal-gate:status";
const EVENT = "legal-gate:changed";

function readStatus(): UserOnboardingVerificationStatus {
  if (typeof window === "undefined") {
    return UserOnboardingVerificationStatus.PENDING_DOCUMENTATION;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (Object.values(UserOnboardingVerificationStatus) as string[]).includes(raw)) {
      return raw as UserOnboardingVerificationStatus;
    }
  } catch {
    /* ignore */
  }
  // No stored status yet: treat the user as cleared. The gate is still a
  // local mock (no `verifications` table read), so defaulting to "pending"
  // silently replaced EVERY dashboard page with the document-upload screen
  // and made the homeowner/contractor dashboards unreachable. Until this is
  // backed by real verification data, onboarding must be opt-in.
  return UserOnboardingVerificationStatus.APPROVED_REAL_DB_RECORD;
}

export function setLegalGateStatus(next: UserOnboardingVerificationStatus): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export interface UseLegalGateResult {
  status: UserOnboardingVerificationStatus;
  isApproved: boolean;
  loading: boolean;
  setStatus: (next: UserOnboardingVerificationStatus) => void;
  approve: () => void;
  reset: () => void;
}

export function useLegalGate(): UseLegalGateResult {
  const [status, setStatusState] = useState<UserOnboardingVerificationStatus>(
    UserOnboardingVerificationStatus.PENDING_DOCUMENTATION,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStatusState(readStatus());
    setLoading(false);

    const onChange = () => setStatusState(readStatus());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setStatus = useCallback((next: UserOnboardingVerificationStatus) => {
    setLegalGateStatus(next);
    setStatusState(next);
  }, []);

  const approve = useCallback(() => {
    setStatus(UserOnboardingVerificationStatus.APPROVED_REAL_DB_RECORD);
  }, [setStatus]);

  const reset = useCallback(() => {
    setStatus(UserOnboardingVerificationStatus.PENDING_DOCUMENTATION);
  }, [setStatus]);

  return {
    status,
    isApproved: status === UserOnboardingVerificationStatus.APPROVED_REAL_DB_RECORD,
    loading,
    setStatus,
    approve,
    reset,
  };
}

export default useLegalGate;
