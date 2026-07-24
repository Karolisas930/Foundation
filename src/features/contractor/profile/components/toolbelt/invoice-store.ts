/**
 * Invoice store — in-memory ledger for Voice-to-Invoice drafts plus the
 * template configuration used to render professional PDFs. Kept alongside
 * the receipt/trip ledgers in the Toolbelt module so it survives across
 * modal open/close cycles for the current session.
 *
 * A template can be one of two shapes:
 *   • "custom"  — the user uploaded their own PDF/image/JPG template.
 *   • "auto"    — we generate a professional layout from the account's
 *                 company + legal information (falls back to the handyman
 *                 profile the user completed during onboarding).
 */
import { useEffect, useState } from "react";
import {
  getActiveHandymanProfile,
  updateActiveHandymanProfile,
} from "@/features/contractor/profile/profile-gate";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type InvoiceEntry = {
  id: string;
  createdAt: number;
  date: string; // ISO date (yyyy-mm-dd)
  client: string;
  description: string;
  amount: number; // EUR
  status: InvoiceStatus;
  sentAt?: number;
  paidAt?: number;
  lastResendAt?: number;
};

export type CompanyLegalInfo = {
  companyName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  email?: string;
  phone?: string;
  companyRegistration?: string; // Handelsregister number
  vatId?: string; // USt-IdNr
  taxNumber?: string; // Steuernummer
  managingDirector?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
};

export type InvoiceTemplateFile = {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: number;
};

/* ------------------------------------------------------------------ */
/*  Cross-store persistence keys                                       */
/*  These are the SAME localStorage keys the Business Settings         */
/*  modals (Payout & Bank, Handwerkskarte & Gewerbe, etc.) already     */
/*  read/write, so the Legal & Company Information editor on the       */
/*  Voice-to-Invoice sheet stays in sync in both directions.           */
/* ------------------------------------------------------------------ */
const LEGAL_STORAGE_KEY = "hw:profile:legal";
const PAYOUT_STORAGE_KEY = "hw:bs:payout";
const HANDWERKSKARTE_META_KEY = "hw:bs:handwerkskarte:meta";

type PayoutStored = {
  holder?: string;
  iban?: string;
  bic?: string;
  bank?: string;
} | null;

type HandwerkskarteMeta = {
  companyRegistration?: string;
  vatId?: string;
  taxNumber?: string;
  managingDirector?: string;
} | null;

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify any listeners (BusinessSettingsModals dispatches the same
    // synthetic event on save so both surfaces converge).
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* ignore quota / private mode errors */
  }
}

const invoiceLedger: { entries: InvoiceEntry[] } = { entries: [] };
const listeners = new Set<() => void>();

// Session-scoped template + company legal info. These fields aren't yet in
// the onboarding form, so we hold them locally and let the user fill them
// in from the invoice history sheet. Any fields already present on the
// active handyman profile are used as defaults.
const templateStore: {
  file: InvoiceTemplateFile | null;
  companyExtras: CompanyLegalInfo;
} = {
  file: null,
  companyExtras: safeRead<CompanyLegalInfo>(LEGAL_STORAGE_KEY) ?? {},
};

/* Re-hydrate whenever another surface (Payout & Bank modal, another tab)
   writes to one of the shared keys. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (
      e.key === LEGAL_STORAGE_KEY ||
      e.key === PAYOUT_STORAGE_KEY ||
      e.key === HANDWERKSKARTE_META_KEY
    ) {
      const fresh = safeRead<CompanyLegalInfo>(LEGAL_STORAGE_KEY) ?? {};
      templateStore.companyExtras = fresh;
      emit();
    }
  });
}

function emit() {
  listeners.forEach((fn) => fn());
}

function useSubscribe() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
}

// ---- Invoice ledger ----

export function addInvoice(input: Omit<InvoiceEntry, "id" | "createdAt">): InvoiceEntry {
  const now = Date.now();
  const entry: InvoiceEntry = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    sentAt: input.status === "sent" || input.status === "paid" ? now : input.sentAt,
    paidAt: input.status === "paid" ? now : input.paidAt,
  };
  invoiceLedger.entries.push(entry);
  emit();
  return entry;
}

export function updateInvoice(id: string, patch: Partial<InvoiceEntry>) {
  const idx = invoiceLedger.entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  invoiceLedger.entries[idx] = { ...invoiceLedger.entries[idx], ...patch };
  emit();
}

export function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const inv = invoiceLedger.entries.find((e) => e.id === id);
  if (!inv) return;
  const now = Date.now();
  const patch: Partial<InvoiceEntry> = { status };
  if (status === "sent" && !inv.sentAt) patch.sentAt = now;
  if (status === "paid") {
    patch.paidAt = now;
    if (!inv.sentAt) patch.sentAt = now;
  }
  updateInvoice(id, patch);
}

export function markInvoiceResent(id: string) {
  const now = Date.now();
  const inv = invoiceLedger.entries.find((e) => e.id === id);
  if (!inv) return;
  updateInvoice(id, {
    lastResendAt: now,
    sentAt: inv.sentAt ?? now,
    status: inv.status === "draft" ? "sent" : inv.status,
  });
}

export function deleteInvoice(id: string) {
  invoiceLedger.entries = invoiceLedger.entries.filter((e) => e.id !== id);
  emit();
}

export function useAllInvoices(): InvoiceEntry[] {
  useSubscribe();
  // Newest first.
  return [...invoiceLedger.entries].sort((a, b) => b.createdAt - a.createdAt);
}

export function useRecentInvoices(limit = 3): InvoiceEntry[] {
  const all = useAllInvoices();
  return all.slice(0, limit);
}

// ---- Template store ----

export function useInvoiceTemplateFile(): InvoiceTemplateFile | null {
  useSubscribe();
  return templateStore.file;
}

export function setInvoiceTemplateFile(file: InvoiceTemplateFile | null) {
  templateStore.file = file;
  emit();
}

/**
 * Merge onboarding profile + locally-collected legal extras into a single
 * company info object used by the auto-generated template.
 */
export function useCompanyLegalInfo(): CompanyLegalInfo {
  useSubscribe();
  const p = getActiveHandymanProfile();
  const profileFullName =
    p?.firstName || p?.lastName ? [p?.firstName, p?.lastName].filter(Boolean).join(" ") : undefined;
  const fromProfile: CompanyLegalInfo = {
    companyName: profileFullName,
    email: p?.businessEmail,
    phone: p?.mobilePhone,
    address: p?.streetAddress,
    postalCode: p?.postalCode,
    city: p?.city,
    state: p?.state,
    managingDirector: profileFullName,
  };
  const payout = safeRead<PayoutStored>(PAYOUT_STORAGE_KEY);
  const fromPayout: CompanyLegalInfo = payout
    ? {
        companyName: payout.holder || undefined,
        iban: payout.iban || undefined,
        bic: payout.bic || undefined,
        bankName: payout.bank || undefined,
      }
    : {};
  const fromHandwerkskarte = safeRead<HandwerkskarteMeta>(HANDWERKSKARTE_META_KEY) ?? {};
  // Precedence: user-entered extras win, then explicit settings tables,
  // finally the onboarding profile fallback.
  const merged: CompanyLegalInfo = {
    ...fromProfile,
    ...fromPayout,
    ...fromHandwerkskarte,
    ...templateStore.companyExtras,
  };
  // Strip empty strings so validation treats them as missing.
  (Object.keys(merged) as Array<keyof CompanyLegalInfo>).forEach((k) => {
    const v = merged[k];
    if (typeof v === "string" && v.trim().length === 0) delete merged[k];
  });
  return merged;
}

export function updateCompanyLegalInfo(patch: CompanyLegalInfo) {
  templateStore.companyExtras = { ...templateStore.companyExtras, ...patch };
  safeWrite(LEGAL_STORAGE_KEY, templateStore.companyExtras);

  // Persist name/email/phone/postal to the profile ledger when provided so
  // other tools see the same source of truth.
  const profilePatch: Record<string, unknown> = {};
  if (patch.email !== undefined) profilePatch.businessEmail = patch.email;
  if (patch.phone !== undefined) profilePatch.mobilePhone = patch.phone;
  if (patch.postalCode !== undefined) profilePatch.postalCode = patch.postalCode;
  if (patch.city !== undefined) profilePatch.city = patch.city;
  if (patch.state !== undefined) profilePatch.state = patch.state;
  if (patch.address !== undefined) profilePatch.streetAddress = patch.address;
  if (Object.keys(profilePatch).length > 0) {
    try {
      updateActiveHandymanProfile(profilePatch);
    } catch {
      /* profile ledger not initialised in demo — safe to ignore */
    }
  }

  // Mirror bank-related fields to the "Payout & Bank Details" settings
  // table so saving here also updates that sidebar section.
  const bankTouched =
    patch.iban !== undefined ||
    patch.bic !== undefined ||
    patch.bankName !== undefined ||
    patch.companyName !== undefined;
  if (bankTouched) {
    const current = safeRead<PayoutStored>(PAYOUT_STORAGE_KEY) ?? {};
    const nextPayout = {
      holder: patch.companyName ?? current?.holder ?? templateStore.companyExtras.companyName ?? "",
      iban: patch.iban ?? current?.iban ?? templateStore.companyExtras.iban ?? "",
      bic: patch.bic ?? current?.bic ?? templateStore.companyExtras.bic ?? "",
      bank: patch.bankName ?? current?.bank ?? templateStore.companyExtras.bankName ?? "",
    };
    safeWrite(PAYOUT_STORAGE_KEY, nextPayout);
  }

  // Mirror trade-registration fields to the "Handwerkskarte & Gewerbe"
  // settings table so both surfaces stay in sync.
  const tradeTouched =
    patch.companyRegistration !== undefined ||
    patch.vatId !== undefined ||
    patch.taxNumber !== undefined ||
    patch.managingDirector !== undefined;
  if (tradeTouched) {
    const current = safeRead<HandwerkskarteMeta>(HANDWERKSKARTE_META_KEY) ?? {};
    const nextMeta = {
      companyRegistration:
        patch.companyRegistration ??
        current?.companyRegistration ??
        templateStore.companyExtras.companyRegistration ??
        "",
      vatId: patch.vatId ?? current?.vatId ?? templateStore.companyExtras.vatId ?? "",
      taxNumber:
        patch.taxNumber ?? current?.taxNumber ?? templateStore.companyExtras.taxNumber ?? "",
      managingDirector:
        patch.managingDirector ??
        current?.managingDirector ??
        templateStore.companyExtras.managingDirector ??
        "",
    };
    safeWrite(HANDWERKSKARTE_META_KEY, nextMeta);
  }

  emit();
}

// Fields required for a "complete" legal template.
export const REQUIRED_LEGAL_KEYS: Array<{
  key: keyof CompanyLegalInfo;
  label: string;
}> = [
  { key: "companyName", label: "Company / Trade name" },
  { key: "address", label: "Street address" },
  { key: "postalCode", label: "Postal code" },
  { key: "city", label: "City" },
  { key: "email", label: "Contact email" },
  { key: "phone", label: "Contact phone" },
  { key: "companyRegistration", label: "Company Registration (HRB)" },
  { key: "vatId", label: "USt-IdNr" },
  { key: "managingDirector", label: "Managing Director" },
];

export function missingLegalFields(info: CompanyLegalInfo): string[] {
  return REQUIRED_LEGAL_KEYS.filter(({ key }) => {
    const v = info[key];
    return !(typeof v === "string" && v.trim().length > 0);
  }).map(({ label }) => label);
}
