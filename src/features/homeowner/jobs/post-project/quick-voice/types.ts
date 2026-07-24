/**
 * Shared types & constants for the QuickVoiceCard subtree.
 */
import type { VoiceIntakeFields } from "@/lib/voice-intake.functions";

export type UrgencyKey = "asap" | "1-3m" | "3-6m" | "flexible";

export const URGENCY_LABELS: Record<UrgencyKey, string> = {
  asap: "ASAP — as soon as possible",
  "1-3m": "Within 1–3 months",
  "3-6m": "Within 3–6 months",
  flexible: "Flexible timing",
};

export type StructuredDraft = {
  title: string;
  description: string;
  trade: string;
  urgency: UrgencyKey | "";
  budgetMin: string;
  budgetMax: string;
  postalCode: string;
  city: string;
};

export type ApplyFields = (fields: VoiceIntakeFields, transcript: string) => string[];

export const WAVE_BARS = 28;
export const BLOB_CACHE_KEY = "quick-voice-card";
