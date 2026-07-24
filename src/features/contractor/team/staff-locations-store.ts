/**
 * Staff Locations — local-first, consent-first location tracking store.
 *
 * Business owners can see the last known location of team members who
 * have opted in. Consent is per-member and can be revoked at any time.
 * Nothing is captured without an explicit toggle-on + successful
 * navigator.geolocation call.
 *
 * Shape is ready to sync to a Supabase `staff_locations` table later.
 */
import { useSyncExternalStore } from "react";

const CONSENT_KEY = "staff-locations::consent::v1";
const FIXES_KEY = "staff-locations::fixes::v1";

export type ConsentMap = Record<string, { granted: boolean; updatedAt: number }>;

export type LocationFix = {
  memberId: string;
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: number;
};

/* ------------------------------- store ---------------------------------- */

const listeners = new Set<() => void>();
let consentCache: ConsentMap | null = null;
let fixesCache: Record<string, LocationFix> | null = null;
const EMPTY_CONSENT: ConsentMap = {};
const EMPTY_FIXES: Record<string, LocationFix> = {};

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readConsent(): ConsentMap {
  if (consentCache === null) consentCache = loadJson(CONSENT_KEY, {} as ConsentMap);
  return consentCache;
}

function readFixes(): Record<string, LocationFix> {
  if (fixesCache === null) fixesCache = loadJson(FIXES_KEY, {} as Record<string, LocationFix>);
  return fixesCache;
}

function writeConsent(next: ConsentMap) {
  consentCache = next;
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function writeFixes(next: Record<string, LocationFix>) {
  fixesCache = next;
  window.localStorage.setItem(FIXES_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/* -------------------------------- API ----------------------------------- */

export function useConsentMap(): ConsentMap {
  return useSyncExternalStore(subscribe, readConsent, () => EMPTY_CONSENT);
}

export function useLocationFixes(): Record<string, LocationFix> {
  return useSyncExternalStore(subscribe, readFixes, () => EMPTY_FIXES);
}

export function setConsent(memberId: string, granted: boolean) {
  const cur = { ...readConsent() };
  cur[memberId] = { granted, updatedAt: Date.now() };
  writeConsent(cur);
  if (!granted) {
    // revoking consent clears any stored fix for that member.
    const fx = { ...readFixes() };
    delete fx[memberId];
    writeFixes(fx);
  }
}

export function saveFix(fix: LocationFix) {
  const cur = { ...readFixes() };
  cur[fix.memberId] = fix;
  writeFixes(cur);
}

export function clearFix(memberId: string) {
  const cur = { ...readFixes() };
  delete cur[memberId];
  writeFixes(cur);
}

/** Ask the browser for a one-shot GPS fix. Requires prior consent. */
export function captureCurrentLocation(memberId: string): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fix: LocationFix = {
          memberId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        };
        saveFix(fix);
        resolve(fix);
      },
      (err) => reject(new Error(err.message || "Could not get location")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
