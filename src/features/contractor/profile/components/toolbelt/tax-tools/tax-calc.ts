/**
 * tax-calc — pure calculation & export helpers extracted from TaxToolsSheet.
 * Owns the deduction/aggregation math, DATEV CSV builder, and PDF summary
 * generator, so the sheet coordinator only wires state → UI.
 */
import { useMemo } from "react";
import { toast } from "sonner";

export const DEFAULT_VAT_RATE = 0.19;

export const QUARTERS = [
  { key: "all", label: "Full year", months: [0, 11] },
  { key: "q1", label: "Q1", months: [0, 2] },
  { key: "q2", label: "Q2", months: [3, 5] },
  { key: "q3", label: "Q3", months: [6, 8] },
  { key: "q4", label: "Q4", months: [9, 11] },
] as const;

export type QuarterKey = (typeof QUARTERS)[number]["key"];

export interface DbInvoice {
  id: string;
  number: string | null;
  client_name: string | null;
  client_address: string | null;
  status: string;
  document_type: string | null;
  net_total: number | null;
  gross_total: number | null;
  vat_amount: number | null;
  vat_rate: number | null;
  issued_at: string | null;
  created_at: string;
}
export interface DbReceipt {
  id: string;
  vendor: string | null;
  category: string | null;
  amount_cents: number;
  receipt_date: string | null;
  created_at: string;
}
export interface DbTrip {
  id: string;
  purpose: string | null;
  from_location: string | null;
  to_location: string | null;
  km: number | string | null;
  trip_date: string | null;
  created_at: string;
}
export interface DbSettings {
  reserve_percent: number;
  km_rate_cents: number;
}

export function fmtEuro(n: number): string {
  return `${n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}
export function fmtEuroCompact(n: number): string {
  return `${Math.round(n).toLocaleString("de-DE")} €`;
}

export function invoiceDate(i: DbInvoice): Date {
  return new Date(i.issued_at ?? i.created_at);
}
export function receiptDate(r: DbReceipt): Date {
  return new Date(r.receipt_date ?? r.created_at);
}
export function tripDate(t: DbTrip): Date {
  return new Date(t.trip_date ?? t.created_at);
}

export function inPeriod(d: Date, year: number, quarter: QuarterKey): boolean {
  if (d.getFullYear() !== year) return false;
  const q = QUARTERS.find((x) => x.key === quarter)!;
  const m = d.getMonth();
  return m >= q.months[0] && m <= q.months[1];
}

export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[";,\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
export function fmtDatevDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
export function fmtEuroPlain(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function buildDeadlines(year: number): Array<{
  date: Date;
  title: string;
  kind: "vat" | "income";
}> {
  return [
    { date: new Date(year, 3, 10), title: "VAT return · Q1", kind: "vat" },
    { date: new Date(year, 6, 10), title: "VAT return · Q2", kind: "vat" },
    { date: new Date(year, 6, 31), title: "Income tax return (previous year)", kind: "income" },
    { date: new Date(year, 9, 10), title: "VAT return · Q3", kind: "vat" },
    { date: new Date(year + 1, 0, 10), title: "VAT return · Q4", kind: "vat" },
    { date: new Date(year + 1, 6, 31), title: "Annual VAT return", kind: "vat" },
    { date: new Date(year, 0, 10), title: "VAT return · Q4 (previous year)", kind: "vat" },
  ];
}

export interface TaxComputations {
  availableYears: number[];
  periodInvoices: DbInvoice[];
  periodReceipts: DbReceipt[];
  periodTrips: DbTrip[];
  revenueNet: number;
  revenueGross: number;
  vatCollected: number;
  expensesGross: number;
  expensesNet: number;
  vatPaid: number;
  vatBalance: number;
  kmTotal: number;
  kmDeduction: number;
  profit: number;
  reserveNeeded: number;
  chartData: Array<{ month: string; Umsatz: number; Ausgaben: number }>;
  deadlines: Array<{ date: Date; title: string; kind: "vat" | "income"; daysAway: number }>;
  periodLabel: string;
  isEmpty: boolean;
}

export function useTaxComputations(
  invoices: DbInvoice[],
  receipts: DbReceipt[],
  trips: DbTrip[],
  settings: DbSettings,
  year: number,
  quarter: QuarterKey,
  loading: boolean,
): TaxComputations {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const set = new Set<number>([currentYear, currentYear - 1]);
    invoices.forEach((i) => set.add(invoiceDate(i).getFullYear()));
    receipts.forEach((r) => set.add(receiptDate(r).getFullYear()));
    trips.forEach((t) => set.add(tripDate(t).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [invoices, receipts, trips, currentYear]);

  const periodInvoices = useMemo(
    () => invoices.filter((i) => inPeriod(invoiceDate(i), year, quarter)),
    [invoices, year, quarter],
  );
  const periodReceipts = useMemo(
    () => receipts.filter((r) => inPeriod(receiptDate(r), year, quarter)),
    [receipts, year, quarter],
  );
  const periodTrips = useMemo(
    () => trips.filter((t) => inPeriod(tripDate(t), year, quarter)),
    [trips, year, quarter],
  );

  const revenueNet = periodInvoices.reduce((s, i) => s + Number(i.net_total ?? 0), 0);
  const revenueGross = periodInvoices.reduce((s, i) => s + Number(i.gross_total ?? 0), 0);
  const vatCollected = periodInvoices.reduce(
    (s, i) =>
      s +
      Number(
        i.vat_amount ??
          (Number(i.net_total ?? 0) * Number(i.vat_rate ?? DEFAULT_VAT_RATE * 100)) / 100,
      ),
    0,
  );
  const expensesGross = periodReceipts.reduce((s, r) => s + Number(r.amount_cents ?? 0) / 100, 0);
  const expensesNet = expensesGross / (1 + DEFAULT_VAT_RATE);
  const vatPaid = expensesGross - expensesNet;
  const vatBalance = vatCollected - vatPaid;
  const kmTotal = periodTrips.reduce((s, t) => s + Number(t.km ?? 0), 0);
  const kmDeduction = (kmTotal * settings.km_rate_cents) / 100;
  const profit = revenueNet - expensesNet - kmDeduction;
  const reserveNeeded = Math.max(0, (profit * settings.reserve_percent) / 100);

  const chartData = useMemo(() => {
    const q = QUARTERS.find((x) => x.key === quarter)!;
    const months: Array<{ month: string; Umsatz: number; Ausgaben: number }> = [];
    for (let m = q.months[0]; m <= q.months[1]; m++) {
      const label = new Date(year, m, 1).toLocaleString("de-DE", { month: "short" });
      const rev = invoices
        .filter((i) => {
          const d = invoiceDate(i);
          return d.getFullYear() === year && d.getMonth() === m;
        })
        .reduce((s, i) => s + Number(i.net_total ?? 0), 0);
      const exp = receipts
        .filter((r) => {
          const d = receiptDate(r);
          return d.getFullYear() === year && d.getMonth() === m;
        })
        .reduce((s, r) => s + Number(r.amount_cents ?? 0) / 100, 0);
      months.push({ month: label, Umsatz: Math.round(rev), Ausgaben: Math.round(exp) });
    }
    return months;
  }, [invoices, receipts, year, quarter]);

  const deadlines = useMemo(() => {
    const now = new Date();
    return buildDeadlines(year)
      .map((d) => ({
        ...d,
        daysAway: Math.round((d.date.getTime() - now.getTime()) / 86_400_000),
      }))
      .filter((d) => d.daysAway >= -7 && d.daysAway <= 365)
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 5);
  }, [year]);

  const periodLabel =
    quarter === "all" ? `${year}` : `${QUARTERS.find((q) => q.key === quarter)!.label} ${year}`;

  const isEmpty =
    !loading &&
    periodInvoices.length === 0 &&
    periodReceipts.length === 0 &&
    periodTrips.length === 0;

  return {
    availableYears,
    periodInvoices,
    periodReceipts,
    periodTrips,
    revenueNet,
    revenueGross,
    vatCollected,
    expensesGross,
    expensesNet,
    vatPaid,
    vatBalance,
    kmTotal,
    kmDeduction,
    profit,
    reserveNeeded,
    chartData,
    deadlines,
    periodLabel,
    isEmpty,
  };
}

export interface ExportArgs {
  periodLabel: string;
  periodInvoices: DbInvoice[];
  periodReceipts: DbReceipt[];
  periodTrips: DbTrip[];
  settings: DbSettings;
  revenueNet: number;
  vatCollected: number;
  expensesNet: number;
  vatPaid: number;
  vatBalance: number;
  kmTotal: number;
  kmDeduction: number;
  profit: number;
}

export function exportDatevCsv(a: ExportArgs) {
  const HEADERS = [
    "Belegdatum",
    "Belegnummer",
    "Buchungstext",
    "Kundenname",
    "Kundenadresse",
    "Umsatz Brutto",
    "Steuersatz",
    "USt-Betrag",
    "Umsatz Netto",
    "Waehrung",
    "Belegart",
    "Status",
  ];
  const invRows = a.periodInvoices.map((i) => {
    const net = Number(i.net_total ?? 0);
    const gross = Number(i.gross_total ?? 0) || net * (1 + DEFAULT_VAT_RATE);
    const vat = Number(i.vat_amount ?? gross - net);
    const rate = Number(i.vat_rate ?? DEFAULT_VAT_RATE * 100);
    return [
      fmtDatevDate(invoiceDate(i)),
      i.number ?? i.id.slice(0, 8).toUpperCase(),
      `Rechnung ${i.client_name ?? ""}`.trim(),
      i.client_name ?? "",
      i.client_address ?? "",
      fmtEuroPlain(gross),
      `${rate.toFixed(1).replace(".", ",")}%`,
      fmtEuroPlain(vat),
      fmtEuroPlain(net),
      "EUR",
      i.document_type === "storno"
        ? "Stornorechnung"
        : i.document_type === "correction"
          ? "Korrektur"
          : "Rechnung",
      i.status,
    ];
  });
  const recHeader = [
    "Belegdatum",
    "Lieferant",
    "Kategorie",
    "Brutto",
    "Steuersatz",
    "Vorsteuer",
    "Netto",
    "Waehrung",
  ];
  const recRows = a.periodReceipts.map((r) => {
    const gross = Number(r.amount_cents ?? 0) / 100;
    const net = gross / (1 + DEFAULT_VAT_RATE);
    const vat = gross - net;
    return [
      fmtDatevDate(receiptDate(r)),
      r.vendor ?? "",
      r.category ?? "",
      fmtEuroPlain(gross),
      `${(DEFAULT_VAT_RATE * 100).toFixed(1).replace(".", ",")}%`,
      fmtEuroPlain(vat),
      fmtEuroPlain(net),
      "EUR",
    ];
  });
  const trpHeader = ["Datum", "Zweck", "Von", "Nach", "Km", "Pauschale (EUR)"];
  const trpRows = a.periodTrips.map((t) => {
    const km = Number(t.km ?? 0);
    return [
      fmtDatevDate(tripDate(t)),
      t.purpose ?? "",
      t.from_location ?? "",
      t.to_location ?? "",
      km.toString().replace(".", ","),
      fmtEuroPlain((km * a.settings.km_rate_cents) / 100),
    ];
  });

  const summary = [
    ["Zeitraum", a.periodLabel],
    ["Erstellt am", fmtDatevDate(new Date())],
    ["Umsatz Netto", fmtEuroPlain(a.revenueNet) + " EUR"],
    ["USt vereinnahmt", fmtEuroPlain(a.vatCollected) + " EUR"],
    ["Ausgaben Netto", fmtEuroPlain(a.expensesNet) + " EUR"],
    ["Vorsteuer", fmtEuroPlain(a.vatPaid) + " EUR"],
    ["USt-Zahllast", fmtEuroPlain(a.vatBalance) + " EUR"],
    ["KM Pauschale", fmtEuroPlain(a.kmDeduction) + " EUR"],
    ["Gewinn vor Steuer", fmtEuroPlain(a.profit) + " EUR"],
  ];

  const parts: string[] = [];
  parts.push("# Übersicht");
  parts.push("Position;Wert");
  summary.forEach((r) => parts.push(r.map(csvEscape).join(";")));
  parts.push("");
  parts.push("# Rechnungen (Ausgangsbuch)");
  parts.push(HEADERS.map(csvEscape).join(";"));
  invRows.forEach((r) => parts.push(r.map(csvEscape).join(";")));
  parts.push("");
  parts.push("# Belege (Vorsteuer)");
  parts.push(recHeader.map(csvEscape).join(";"));
  recRows.forEach((r) => parts.push(r.map(csvEscape).join(";")));
  parts.push("");
  parts.push("# Fahrten (§ 9 EStG)");
  parts.push(trpHeader.map(csvEscape).join(";"));
  trpRows.forEach((r) => parts.push(r.map(csvEscape).join(";")));

  const csv = "\uFEFF" + parts.join("\r\n") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = `DATEV_Steuerbericht_${a.periodLabel.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast.success(`DATEV-Export ${a.periodLabel} erstellt.`);
}

export function exportPdfSummary(a: ExportArgs) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    toast.error("Pop-up blockiert — bitte erlauben und erneut versuchen.");
    return;
  }
  const row = (label: string, value: string, hint = "") =>
    `<tr><td>${label}${hint ? `<div class="hint">${hint}</div>` : ""}</td><td class="num">${value}</td></tr>`;
  const invRows = a.periodInvoices
    .map(
      (i) =>
        `<tr><td>${fmtDatevDate(invoiceDate(i))}</td><td>${i.number ?? "—"}</td><td>${i.client_name ?? ""}</td><td class="num">${fmtEuroPlain(Number(i.net_total ?? 0))}</td><td class="num">${fmtEuroPlain(Number(i.vat_amount ?? 0))}</td><td class="num">${fmtEuroPlain(Number(i.gross_total ?? 0))}</td></tr>`,
    )
    .join("");
  const recRows = a.periodReceipts
    .map((r) => {
      const g = Number(r.amount_cents ?? 0) / 100;
      return `<tr><td>${fmtDatevDate(receiptDate(r))}</td><td>${r.vendor ?? ""}</td><td>${r.category ?? ""}</td><td class="num">${fmtEuroPlain(g)}</td></tr>`;
    })
    .join("");
  w.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>Tax report ${a.periodLabel}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 24px 0 8px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .hint { color: #94a3b8; font-size: 10px; font-weight: normal; margin-top: 2px; }
  .kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .kpi > div { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
  .kpi .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  .foot { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { margin: 20mm; } }
</style></head><body>
<h1>Tax report — ${a.periodLabel}</h1>
<div class="sub">Generated on ${fmtDatevDate(new Date())} · All amounts in EUR</div>

<div class="kpi">
  <div><div class="label">Revenue (net)</div><div class="value">${fmtEuroPlain(a.revenueNet)} €</div></div>
  <div><div class="label">Expenses (net)</div><div class="value">${fmtEuroPlain(a.expensesNet)} €</div></div>
  <div><div class="label">Profit before tax</div><div class="value">${fmtEuroPlain(a.profit)} €</div></div>
</div>

<h2>VAT</h2>
<table>
  ${row("Collected (from invoices)", fmtEuroPlain(a.vatCollected) + " €")}
  ${row("Input VAT (from receipts)", fmtEuroPlain(a.vatPaid) + " €")}
  ${row("Balance to tax office", fmtEuroPlain(a.vatBalance) + " €", a.vatBalance >= 0 ? "payable" : "refund")}
</table>

<h2>Mileage allowance (§ 9 EStG)</h2>
<table>
  ${row("Kilometers driven", `${a.kmTotal.toLocaleString("en-GB")} km`)}
  ${row("Allowance", `${fmtEuroPlain(a.kmDeduction)} €`, `${a.settings.km_rate_cents} ct / km`)}
</table>

<h2>Invoices (${a.periodInvoices.length})</h2>
<table><thead><tr><th>Date</th><th>No.</th><th>Client</th><th class="num">Net</th><th class="num">VAT</th><th class="num">Gross</th></tr></thead>
<tbody>${invRows || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px">No invoices</td></tr>`}</tbody></table>

<h2>Receipts (${a.periodReceipts.length})</h2>
<table><thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th class="num">Gross</th></tr></thead>
<tbody>${recRows || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:16px">No receipts</td></tr>`}</tbody></table>

<div class="foot">Preview for your tax advisor — save via "Print → Save as PDF".</div>
<script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`);
  w.document.close();
  toast.success("PDF summary opened.");
}
