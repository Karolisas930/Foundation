import type { QuoteStatus, QuoteLineItem } from "@/features/contractor/quotes/quote-model";

export const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

export const STATUS_META: Record<QuoteStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  },
  sent: {
    label: "Sent",
    className: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  },
  declined: {
    label: "Declined",
    className: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-orange-500/20 text-orange-200 border-orange-400/30",
  },
};

export type FilterKey = "all" | QuoteStatus;
export type QuoteSource = "lead" | "client" | "manual";

export type Prefill = {
  /** The project this quote is a bid on. */
  jobId?: string;
  jobLabel?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  jobTitle?: string;
  description?: string;
  sourceLabel?: string;
};

export type FormState = {
  jobId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  jobTitle: string;
  description: string;
  items: QuoteLineItem[];
  validDays: number;
  notes: string;
};
