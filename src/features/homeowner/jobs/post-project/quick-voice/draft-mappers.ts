/**
 * Convert between the QuickVoiceCard's editable StructuredDraft shape and
 * the shared VoiceIntakeFields shape used by the extractor/apply pipeline.
 */
import type { VoiceIntakeFields } from "@/lib/voice-intake.functions";
import type { StructuredDraft, UrgencyKey } from "./types";

export function toDraft(fields: VoiceIntakeFields, transcript: string): StructuredDraft {
  const min =
    typeof fields.budgetMin === "number"
      ? fields.budgetMin
      : typeof fields.budget === "number"
        ? Math.round(fields.budget * 0.85)
        : undefined;
  const max =
    typeof fields.budgetMax === "number"
      ? fields.budgetMax
      : typeof fields.budget === "number"
        ? Math.round(fields.budget * 1.15)
        : undefined;
  return {
    title: fields.title?.trim() || "",
    description: (fields.notes?.trim() || transcript.trim()).slice(0, 1200),
    trade: fields.trade ?? "",
    urgency: (fields.timeline as UrgencyKey | undefined) ?? "",
    budgetMin: min ? String(min) : "",
    budgetMax: max ? String(max) : "",
    postalCode: fields.postalCode ?? "",
    city: fields.city ?? "",
  };
}

export function draftToFields(d: StructuredDraft): VoiceIntakeFields {
  const min = d.budgetMin ? Number(d.budgetMin) : undefined;
  const max = d.budgetMax ? Number(d.budgetMax) : undefined;
  const mid =
    Number.isFinite(min) && Number.isFinite(max)
      ? Math.round(((min as number) + (max as number)) / 2)
      : Number.isFinite(min)
        ? min
        : Number.isFinite(max)
          ? max
          : undefined;
  return {
    title: d.title || undefined,
    trade: (d.trade || undefined) as VoiceIntakeFields["trade"],
    notes: d.description || undefined,
    timeline: (d.urgency || undefined) as VoiceIntakeFields["timeline"],
    budget: mid,
    budgetMin: Number.isFinite(min) ? (min as number) : undefined,
    budgetMax: Number.isFinite(max) ? (max as number) : undefined,
    postalCode: d.postalCode || undefined,
    city: d.city || undefined,
  };
}
