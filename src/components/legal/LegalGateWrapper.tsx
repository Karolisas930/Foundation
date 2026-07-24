/**
 * LegalGateWrapper — intercepts protected app children and swaps them for
 * the local onboarding upload dashboard when the user's registration
 * status is not `APPROVED_REAL_DB_RECORD`. Once the status flips to
 * approved, `children` render normally and data reads/writes proceed.
 *
 * Onboarding routes themselves must NEVER be gated (that would loop the
 * user), so the wrapper is applied at `_dashboard`.
 */
import type { ReactNode } from "react";
import { useLegalGate } from "@/hooks/useLegalGate";
import { LegalOnboardingDashboard } from "./LegalOnboardingDashboard";

export function LegalGateWrapper({ children }: { children: ReactNode }) {
  const { isApproved, loading } = useLegalGate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!isApproved) {
    return <LegalOnboardingDashboard />;
  }

  return <>{children}</>;
}

export default LegalGateWrapper;
