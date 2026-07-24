/**
 * Shared types, storage keys and status hook for the Business Settings modals.
 */
import { useEffect, useMemo, useState } from "react";

export type BusinessSettingsModal =
  | "email"
  | "payout"
  | "meister"
  | "insurance"
  | "handwerkskarte"
  | "freistellung"
  | null;

export type EmailState = { provider: "gmail" | "outlook"; address: string } | null;
export type PayoutState = {
  holder: string;
  iban: string;
  bic?: string;
  bank?: string;
} | null;
export type UploadState = {
  name: string;
  size: number;
  uploadedAt: string;
  status: "pending" | "verified";
} | null;

export const KEYS = {
  email: "hw:bs:email",
  payout: "hw:bs:payout",
  meister: "hw:bs:meister",
  insurance: "hw:bs:insurance",
  handwerkskarte: "hw:bs:handwerkskarte",
  freistellung: "hw:bs:freistellung",
} as const;

export function readJSON<T>(key: string): T | null {
  try {
    const v = typeof window === "undefined" ? null : localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* ignore */
  }
}

export function useBusinessSettingsStatus() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || Object.values(KEYS).includes(e.key as (typeof KEYS)[keyof typeof KEYS])) {
        setTick((t) => t + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return useMemo(
    () => ({
      email: readJSON<EmailState>(KEYS.email),
      payout: readJSON<PayoutState>(KEYS.payout),
      meister: readJSON<UploadState>(KEYS.meister),
      insurance: readJSON<UploadState>(KEYS.insurance),
      handwerkskarte: readJSON<UploadState>(KEYS.handwerkskarte),
      freistellung: readJSON<UploadState>(KEYS.freistellung),
      _tick: tick,
    }),
    [tick],
  );
}
