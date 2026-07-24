/**
 * Phase 10 — Legal Gate / user onboarding verification statuses.
 * Pure type definitions only; no runtime logic or components.
 */

export enum UserOnboardingVerificationStatus {
  PENDING_DOCUMENTATION = "PENDING_DOCUMENTATION",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED_REAL_DB_RECORD = "APPROVED_REAL_DB_RECORD",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface LegalGateOnboardingRecord {
  userId: string;
  status: UserOnboardingVerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerNote?: string;
}
