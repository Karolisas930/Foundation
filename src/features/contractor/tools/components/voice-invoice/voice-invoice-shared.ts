/**
 * Shared types / constants / formatters for the Voice to Invoice split.
 */
import { CalendarDays, Moon, Sun } from "lucide-react";

export type SpeechRecInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export type SpeechRecognitionCtor = new () => SpeechRecInstance;

export type VatMode = "19" | "7" | "0" | "manual";

export type SurchargeKey = "night" | "weekend" | "holiday";

export const SURCHARGE_DEFAULTS: Record<SurchargeKey, number> = {
  night: 25,
  weekend: 50,
  holiday: 100,
};

export const SURCHARGE_META: Record<
  SurchargeKey,
  { label: string; short: string; Icon: typeof Moon }
> = {
  night: { label: "Night Work", short: "Night", Icon: Moon },
  weekend: { label: "Sunday / Weekend", short: "Weekend", Icon: CalendarDays },
  holiday: { label: "Public Holiday", short: "Holiday", Icon: Sun },
};

export const fmtEur = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
