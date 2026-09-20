/**
 * Quotes — model + mapping between the UI quote document and the
 * `public.job_bids` row it is stored in.
 *
 * A quote IS a bid: it always belongs to a job (`jobId`), so the homeowner
 * sees it as a real bid on their project as soon as it is sent.
 */
import type { MyBid, BidStatus, BidDetails, BidLineItem } from "@/lib/job-bids.functions";

export type QuoteStatus = BidStatus;
export type QuoteLineItem = BidLineItem;

export type Quote = {
  id: string;
  jobId: string;
  number: string;
  clientName: string;
  clientEmail: string | null;
  jobTitle: string;
  description: string | null;
  items: QuoteLineItem[];
  validDays: number;
  notes: string | null;
  status: QuoteStatus;
  createdAt: number;
  updatedAt: number;
  sentAt: number | null;
};

export function quoteTotal(q: Pick<Quote, "items">): number {
  return q.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
}

export function newLineItem(): QuoteLineItem {
  return {
    id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    service: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function makeQuoteNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${stamp}-${rand}`;
}

export const eurToCents = (eur: number) => Math.round((Number(eur) || 0) * 100);
export const centsToEur = (cents: number) => (Number(cents) || 0) / 100;

function daysBetween(fromIso: string, untilIso: string | null): number {
  if (!untilIso) return 14;
  const days = Math.round(
    (new Date(untilIso).getTime() - new Date(fromIso).getTime()) / 86_400_000,
  );
  return days > 0 ? days : 14;
}

/** Turn a stored bid into the quote document the UI renders. */
export function bidToQuote(bid: MyBid): Quote {
  const d = bid.details;
  const items = (d?.items ?? []).filter((i) => i.service.trim().length > 0);
  const fallbackTotal = centsToEur(bid.laborCents + bid.materialsCents + bid.travelCents);

  return {
    id: bid.id,
    jobId: bid.jobId,
    number: d?.number ?? `Q-${bid.id.slice(0, 8).toUpperCase()}`,
    clientName: d?.clientName ?? bid.ownerName,
    clientEmail: d?.clientEmail ?? null,
    jobTitle: d?.jobTitle ?? bid.jobTitle,
    description: d?.description ?? bid.message ?? null,
    items: items.length
      ? items
      : [
          {
            id: `li_${bid.id}`,
            service: bid.jobTitle || "Quoted work",
            quantity: 1,
            unitPrice: fallbackTotal,
          },
        ],
    validDays: d?.validDays ?? daysBetween(bid.createdAt, bid.validUntil),
    notes: d?.notes ?? null,
    status: bid.status,
    createdAt: new Date(bid.createdAt).getTime(),
    updatedAt: new Date(bid.updatedAt).getTime(),
    sentAt: bid.sentAt ? new Date(bid.sentAt).getTime() : null,
  };
}

/** The quote document to persist on the bid. */
export function quoteToDetails(q: {
  number: string;
  clientName: string;
  clientEmail: string | null;
  jobTitle: string;
  description: string | null;
  items: QuoteLineItem[];
  validDays: number;
  notes: string | null;
}): BidDetails {
  return {
    number: q.number,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    jobTitle: q.jobTitle,
    description: q.description,
    items: q.items,
    validDays: q.validDays,
    notes: q.notes,
  };
}

/** ISO date (YYYY-MM-DD) `validDays` from now. */
export function validUntilDate(validDays: number): string {
  return new Date(Date.now() + Math.max(1, validDays) * 86_400_000).toISOString().slice(0, 10);
}
