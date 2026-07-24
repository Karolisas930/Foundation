/**
 * Compliance Lead-Gate — server function.
 *
 * Returns the authoritative gate decision for the signed-in contractor by
 * combining profile completeness (license + insurance uploads), the
 * `profiles.flagged` moderation flag, any open `profile_reports`, and the
 * per-profile trial / subscription flags (launch-window default TRUE).
 *
 * Callers: HandymanWorkspace, MatchUnlockInbox, chat / message initiators.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  defaultTrialActive,
  deriveVerificationState,
  evaluateLeadGate,
  type LeadGateDecision,
} from "@/features/contractor/leads/lead-gate";

export const getContractorLeadGate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadGateDecision> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, flagged")
      .eq("id", userId)
      .maybeSingle();

    const { data: reports } = await supabase
      .from("profile_reports")
      .select("status")
      .eq("reported_id", userId);

    // Credential presence lives in the ecosystem ledger for the demo build;
    // the server function is intentionally conservative and treats the
    // documents as unuploaded here — HandymanWorkspace overlays the local
    // ledger state before rendering the gate to the user.
    const verificationState = deriveVerificationState({
      hasLicenseDoc: false,
      hasInsuranceDoc: false,
      flagged: profile?.flagged ?? false,
      openReportStatuses: (reports ?? []).map((r: { status: string }) => r.status),
    });

    return evaluateLeadGate({
      verificationState,
      // Launch policy: free-trial window default. Flip this per-profile
      // once the paid subscription table lands — no UI changes needed.
      isTrialActive: defaultTrialActive(),
      hasActiveSubscription: false,
    });
  });
