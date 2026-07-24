/**
 * Helper that merges AI-extracted voice intake fields into the
 * HomeownerForm state. Existing values are preserved; returns the
 * human-readable labels of fields actually filled.
 */
import { TRADE_OPTIONS, type TradeDetails } from "./parts";
import type { VoiceIntakeFields } from "@/lib/voice-intake.functions";

type FormSetters = {
  projectTitle: string;
  setProjectTitle: (v: string) => void;
  trade: string;
  setTrade: (v: string) => void;
  setBudget: (v: number) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  // Not currently auto-filled, kept for future expansion.
  tradeDetails?: TradeDetails;
};

export function applyVoiceFields(
  fields: VoiceIntakeFields,
  transcript: string,
  state: FormSetters,
): string[] {
  const filled: string[] = [];

  if (fields.title && state.projectTitle.trim() === "") {
    state.setProjectTitle(fields.title.slice(0, 120));
    filled.push("title");
  }
  if (fields.trade && !state.trade) {
    const match = (TRADE_OPTIONS as readonly string[]).includes(fields.trade)
      ? fields.trade
      : undefined;
    if (match) {
      state.setTrade(match);
      filled.push("trade");
    }
  }
  if (typeof fields.budget === "number" && Number.isFinite(fields.budget) && fields.budget > 0) {
    state.setBudget(Math.round(fields.budget));
    filled.push("budget");
  } else if (
    typeof fields.budgetMin === "number" &&
    typeof fields.budgetMax === "number" &&
    Number.isFinite(fields.budgetMin) &&
    Number.isFinite(fields.budgetMax)
  ) {
    state.setBudget(Math.round((fields.budgetMin + fields.budgetMax) / 2));
    filled.push("budget");
  }
  if (fields.timeline && !state.timeline) {
    state.setTimeline(fields.timeline);
    filled.push("timeline");
  }
  if (fields.postalCode && !state.postalCode.trim()) {
    state.setPostalCode(fields.postalCode.replace(/[^0-9]/g, "").slice(0, 5));
    filled.push("postal code");
  }
  if (fields.city && !state.city.trim()) {
    state.setCity(fields.city);
    filled.push("city");
  }

  const extras: string[] = [];
  if (typeof fields.sizeM2 === "number" && Number.isFinite(fields.sizeM2)) {
    extras.push(`Approx. size: ${fields.sizeM2} m²`);
  }
  const dims: string[] = [];
  if (typeof fields.lengthM === "number") dims.push(`L ${fields.lengthM}m`);
  if (typeof fields.widthM === "number") dims.push(`W ${fields.widthM}m`);
  if (typeof fields.heightM === "number") dims.push(`H ${fields.heightM}m`);
  if (dims.length) extras.push(`Dimensions: ${dims.join(" × ")}`);
  if (typeof fields.rooms === "number" && Number.isFinite(fields.rooms)) {
    extras.push(`Rooms: ${fields.rooms}`);
  }
  if (typeof fields.floors === "number" && Number.isFinite(fields.floors)) {
    extras.push(`Floors: ${fields.floors}`);
  }
  if (typeof fields.budgetMin === "number" && typeof fields.budgetMax === "number") {
    extras.push(`Budget range: € ${fields.budgetMin}–${fields.budgetMax}`);
  }
  if (fields.notes) extras.push(fields.notes);

  if (state.notes.trim() === "") {
    const composed = [transcript.trim(), extras.join(" · ")].filter(Boolean).join("\n\n");
    if (composed) {
      state.setNotes(composed.slice(0, 2000));
      filled.push("notes");
    }
  }

  return filled;
}
