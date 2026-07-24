/**
 * DATEV-friendly CSV export for the in-app invoice ledger.
 *
 * The ledger only stores gross amounts, so we derive Netto / MwSt using the
 * standard German VAT rate (19%). Columns and headers follow the DATEV
 * convention used by German accountants (Rechnungsausgangsbuch).
 */
import type { InvoiceEntry, InvoiceStatus } from "./invoice-store";

const DEFAULT_VAT_RATE = 0.19;

const STATUS_DE: Record<InvoiceStatus, string> = {
  draft: "Entwurf",
  sent: "Versendet",
  paid: "Bezahlt",
  overdue: "Überfällig",
};

// DATEV / German-accountant column headers.
const HEADERS = [
  "Rechnungsnummer",
  "Rechnungsdatum",
  "Kundenname",
  "Kundenadresse",
  "Nettobetrag",
  "MwSt-Satz",
  "MwSt-Betrag",
  "Bruttobetrag",
  "Waehrung",
  "Leistungsbeschreibung",
  "Zahlungsstatus",
  "Versendet am",
  "Bezahlt am",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // DATEV/Excel-DE reads ';' as delimiter — quote anything with ; " , or newline.
  if (/[";,\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtEuro(n: number): string {
  // German decimal comma, no thousands separator (safest for DATEV import).
  return n.toFixed(2).replace(".", ",");
}

function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso ?? "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function fmtTimestamp(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function invoiceNumber(inv: InvoiceEntry): string {
  const year = inv.date?.slice(0, 4) ?? new Date(inv.createdAt).getFullYear().toString();
  return `RE-${year}-${inv.id.slice(0, 8).toUpperCase()}`;
}

export function buildDatevCsv(invoices: InvoiceEntry[], opts: { vatRate?: number } = {}): string {
  const rate = opts.vatRate ?? DEFAULT_VAT_RATE;

  const rows = invoices.map((inv) => {
    const brutto = Number(inv.amount ?? 0);
    const netto = brutto / (1 + rate);
    const mwst = brutto - netto;

    return [
      invoiceNumber(inv),
      fmtDate(inv.date),
      inv.client ?? "",
      "", // Kundenadresse — not captured by voice-to-invoice yet
      fmtEuro(netto),
      `${(rate * 100).toFixed(1).replace(".", ",")}%`,
      fmtEuro(mwst),
      fmtEuro(brutto),
      "EUR",
      inv.description ?? "",
      STATUS_DE[inv.status] ?? inv.status,
      fmtTimestamp(inv.sentAt),
      fmtTimestamp(inv.paidAt),
    ];
  });

  const header = HEADERS.map(csvEscape).join(";");
  const body = rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
  // BOM so Excel-DE opens Umlaute correctly.
  return "\uFEFF" + header + "\r\n" + body + (body ? "\r\n" : "");
}

export function downloadDatevCsv(invoices: InvoiceEntry[], filename?: string) {
  const csv = buildDatevCsv(invoices);
  const today = new Date().toISOString().slice(0, 10);
  const name = filename ?? `DATEV_Rechnungen_${today}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
