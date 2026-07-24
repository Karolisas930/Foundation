/**
 * Compliance Lead-Gate — pure module.
 *
 * Single source of truth for the "can this contractor act on a homeowner
 * lead?" decision. Consumed by the matching engine pipeline (job feed) and
 * every contractor-facing lead / chat surface.
 *
 * Rule (strict):
 *   ALLOW iff  is_verified === true
 *          AND (is_trial_active === true OR has_active_subscription === true)
 *
 * Unverified / pending / flagged / under_review contractors may still SEE
 * regional lead cards on the radar feed but MUST NOT see personal contact
 * fields and MUST NOT be able to message, initiate chat, or unlock a lead.
 *
 * Launch policy: `is_trial_active` is hardcoded to default TRUE for the
 * first 10–18 months so the platform is 100% free at launch. Flipping the
 * `INITIAL_FREE_TRIAL_UNTIL` date (or setting `has_active_subscription`
 * per profile) is the only switch needed to enable paid subscriptions —
 * no frontend, matching-engine, or chat component needs to change.
 */

/** ISO date at which the launch-wide free trial ends. Update to toggle paywall. */
export const INITIAL_FREE_TRIAL_UNTIL = "2027-05-01T00:00:00.000Z";

/**
 * Fallback default for `is_trial_active` when no per-profile trial state
 * exists yet. Kept TRUE for the launch window described above.
 */
export function defaultTrialActive(now: Date = new Date()): boolean {
  return now.getTime() < Date.parse(INITIAL_FREE_TRIAL_UNTIL);
}

/**
 * Verification lifecycle values persisted (or derived) for a contractor.
 * - "unuploaded": no Meisterbrief / trade license on file
 * - "pending":    documents uploaded, awaiting review
 * - "under_review": manual review in progress (e.g. after profile_reports)
 * - "flagged":    profile flagged by moderation
 * - "verified":   documents accepted; full access granted
 */
export type VerificationState = "unuploaded" | "pending" | "under_review" | "flagged" | "verified";

/** Minimal shape needed to evaluate the compliance gate. */
export interface ContractorComplianceProfile {
  verificationState: VerificationState;
  /** True when the launch-window free trial is active for this profile. */
  isTrialActive?: boolean;
  /** True when a paid subscription is currently active. */
  hasActiveSubscription?: boolean;
}

/** Reason codes explaining why the gate is closed. */
export type LeadGateReason =
  | "verification_required"
  | "verification_pending"
  | "verification_flagged"
  | "subscription_required";

export interface LeadGateDecision {
  /** True iff the contractor may unlock leads, view PII, and start chats. */
  canUnlockLeads: boolean;
  /** True iff the contractor may send / receive lead messages. */
  canMessage: boolean;
  /** True iff full personal contact fields may be revealed to this viewer. */
  canViewPersonalInfo: boolean;
  /** Contractors always keep read access to regional radar cards. */
  canSeeRadarFeed: true;
  reason: LeadGateReason | null;
  verificationState: VerificationState;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
}

/**
 * German-language compliance banner shown on the contractor dashboard and
 * every restricted lead surface.
 */
export const COMPLIANCE_BANNER_DE =
  "Verifizierung erforderlich: Laden Sie Ihren Meisterbrief hoch, um vollständige Kontaktdaten freizuschalten und Kunden direkt zu kontaktieren.";

/** Evaluate the compliance gate for a contractor profile. */
export function evaluateLeadGate(profile: ContractorComplianceProfile): LeadGateDecision {
  const isTrialActive = profile.isTrialActive ?? defaultTrialActive();
  const hasActiveSubscription = profile.hasActiveSubscription ?? false;
  const verified = profile.verificationState === "verified";
  const paid = isTrialActive || hasActiveSubscription;

  let reason: LeadGateReason | null = null;
  if (!verified) {
    switch (profile.verificationState) {
      case "flagged":
        reason = "verification_flagged";
        break;
      case "pending":
      case "under_review":
        reason = "verification_pending";
        break;
      default:
        reason = "verification_required";
    }
  } else if (!paid) {
    reason = "subscription_required";
  }

  const allow = verified && paid;
  return {
    canUnlockLeads: allow,
    canMessage: allow,
    canViewPersonalInfo: allow,
    canSeeRadarFeed: true,
    reason,
    verificationState: profile.verificationState,
    isTrialActive,
    hasActiveSubscription,
  };
}

/**
 * Derive the verification state from raw DB signals.
 * `profiles.flagged` (moderation) and any open `profile_reports.status`
 * ('open' / 'under_review') both funnel the contractor out of "verified".
 */
export function deriveVerificationState(input: {
  hasLicenseDoc: boolean;
  hasInsuranceDoc: boolean;
  flagged?: boolean | null;
  openReportStatuses?: string[];
}): VerificationState {
  if (input.flagged) return "flagged";
  const reports = input.openReportStatuses ?? [];
  if (reports.some((s) => s === "under_review")) return "under_review";
  if (reports.some((s) => s === "open" || s === "pending")) return "under_review";
  if (!input.hasLicenseDoc || !input.hasInsuranceDoc) return "unuploaded";
  // Documents present, no flags / reports — treat as pending manual approval
  // until the moderation team flips the record to "verified".
  return "pending";
}

/** Mask a personal-info string behind an unreadable placeholder. */
export function maskPersonalField(
  value: string | null | undefined,
  kind: "name" | "phone" | "email" | "address" | "generic" = "generic",
): string {
  if (!value) return "";
  switch (kind) {
    case "phone":
      return "•••• ••• ••••";
    case "email":
      return "•••••••@••••••.••";
    case "address":
      return "••••••••••••, ••••• ••••";
    case "name":
      return "•••••• ••••••";
    default:
      return "••••••••••";
  }
}
