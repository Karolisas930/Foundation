/**
 * Master monetization toggle.
 *
 * When `false`, the app runs in launch-free mode: every premium feature
 * (DATEV / accountant CSV exports, Team GPS location tracking, etc.) is
 * automatically unlocked for every user, regardless of subscription or
 * trial state.
 *
 * When `true`, premium features enforce the standard trial /
 * subscription check via `hasPremiumAccess()` below.
 */
export const IS_MONETIZATION_ENABLED = false;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "none";

export interface SubscriptionCheckInput {
  status?: SubscriptionStatus | null;
  trialEndsAt?: string | Date | null;
}

/** Returns true if the given profile currently has premium access. */
export function hasPremiumAccess(sub?: SubscriptionCheckInput): boolean {
  // Master switch: monetization off → everything is free.
  if (!IS_MONETIZATION_ENABLED) return true;

  if (!sub) return false;
  if (sub.status === "active") return true;

  if (sub.status === "trialing" && sub.trialEndsAt) {
    const end = sub.trialEndsAt instanceof Date ? sub.trialEndsAt : new Date(sub.trialEndsAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() > Date.now()) return true;
  }

  return false;
}
