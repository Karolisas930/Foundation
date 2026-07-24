/**
 * Profile completion gate for the handyman quote/bid flow.
 *
 * Users can browse jobs freely, but to send quotes/bids they must complete
 * their profile with license + insurance uploads. Helpers here read the
 * latest handyman profile from the ledger, compute completion, and
 * persist uploaded credential documents back into the same record.
 */
import { getEcosystemLedger, updateEcosystemLedger } from "@/core/demo-session";

export type CredentialDoc = {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
};

export type HandymanProfile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  businessEmail?: string;
  mobilePhone?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  streetAddress?: string;
  trades?: string[];
  radiusKm?: number;
  minProjectSize?: number;
  languages?: string[];
  licenseDoc?: CredentialDoc;
  insuranceDoc?: CredentialDoc;
};

export type ProfileCompletion = {
  profile: HandymanProfile | null;
  percent: number;
  missing: string[];
  complete: boolean;
};

const REQUIREMENTS: Array<{ key: string; label: string; test: (p: HandymanProfile) => boolean }> = [
  { key: "name", label: "Full name", test: (p) => Boolean(p.firstName && p.lastName) },
  {
    key: "contact",
    label: "Email & phone",
    test: (p) => Boolean(p.businessEmail && p.mobilePhone),
  },
  { key: "location", label: "Service location", test: (p) => Boolean(p.postalCode) },
  {
    key: "trades",
    label: "At least one trade",
    test: (p) => Boolean(p.trades && p.trades.length > 0),
  },
  { key: "license", label: "Handwerkskammer / trade license", test: (p) => Boolean(p.licenseDoc) },
  {
    key: "insurance",
    label: "Liability insurance certificate",
    test: (p) => Boolean(p.insuranceDoc),
  },
];

export function getActiveHandymanProfile(): HandymanProfile | null {
  const ledger = getEcosystemLedger();
  const list = ledger.profiles?.handyman as Array<Record<string, unknown>> | undefined;
  if (!list || list.length === 0) return null;
  return list[list.length - 1] as HandymanProfile;
}

export function getHandymanCompletion(profile?: HandymanProfile | null): ProfileCompletion {
  const p = profile ?? getActiveHandymanProfile();
  if (!p) {
    return {
      profile: null,
      percent: 0,
      missing: REQUIREMENTS.map((r) => r.label),
      complete: false,
    };
  }
  const passed = REQUIREMENTS.filter((r) => r.test(p));
  const missing = REQUIREMENTS.filter((r) => !r.test(p)).map((r) => r.label);
  const percent = Math.round((passed.length / REQUIREMENTS.length) * 100);
  return { profile: p, percent, missing, complete: missing.length === 0 };
}

export function updateActiveHandymanProfile(
  patch: Partial<HandymanProfile>,
): HandymanProfile | null {
  const ledger = getEcosystemLedger();
  const list = ledger.profiles?.handyman as Array<Record<string, unknown>> | undefined;
  if (!list || list.length === 0) return null;
  const idx = list.length - 1;
  const merged = { ...(list[idx] as HandymanProfile), ...patch };
  list[idx] = merged as Record<string, unknown> & { id: string };
  updateEcosystemLedger(ledger);
  return merged;
}

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB cap for demo uploads

export async function readCredentialFile(file: File): Promise<CredentialDoc> {
  if (file.size > MAX_DOC_BYTES) {
    throw new Error("File too large — please keep credential uploads under 5 MB.");
  }
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}
