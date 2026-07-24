/**
 * Phase 11 — DATEV / accounting CSV export utilities.
 *
 * Pulls locally-tracked Phase 5 data (staff hours, hourly rates, km trips,
 * expense receipts) and compiles a DATEV-compatible CSV string. Pure
 * functions — no I/O, no DOM — so they are safe to import from server
 * functions, unit tests, or a browser download handler.
 *
 * DATEV "Buchungsstapel" CSV conventions used here:
 *   - Field separator: `;`
 *   - Decimal separator: `,` (German locale)
 *   - Date format:      `TTMMJJJJ` (e.g. 23072026)
 *   - Amount:           positive with `Soll/Haben-Kennzeichen` (S/H)
 *   - Encoding target:  Windows-1252 (we emit UTF-8 with BOM; the CSV
 *                       importer of the customer's tax package handles it)
 *
 * We emit the "reduced" 12-column DATEV Buchungsstapel header the SKR03/04
 * importers accept for freelancer bookkeeping — enough for a Steuerberater
 * to map into DATEV Unternehmen online without manual cleanup.
 */

// ---------------------------------------------------------------------------
// Input types — derived from the Phase 5 tracking surface
// ---------------------------------------------------------------------------

export interface StaffHourEntry {
  /** ISO date of work (YYYY-MM-DD). */
  workDate: string;
  staffName: string;
  hours: number;
  /** Hourly rate in cents. */
  hourlyRateCents: number;
  jobRef?: string | null;
}

export interface TripEntry {
  tripDate: string;
  fromAddress?: string | null;
  toAddress?: string | null;
  km: number;
  /** Rate per km in cents (defaults to €0,30). */
  kmRateCents?: number;
  jobRef?: string | null;
}

export interface ExpenseEntry {
  expenseDate: string;
  vendor: string;
  description?: string | null;
  /** Gross amount in cents. */
  grossCents: number;
  /** VAT percent (e.g. 19, 7, 0). */
  vatPercent: number;
  category?: string | null;
  jobRef?: string | null;
}

export interface DatevExportInput {
  hours?: StaffHourEntry[];
  trips?: TripEntry[];
  expenses?: ExpenseEntry[];
  /** ISO date range covered — used for the filename & metadata line. */
  from: string;
  to: string;
  /** Consultant/client numbers optional; defaults are safe placeholders. */
  consultantNumber?: string;
  clientNumber?: string;
}

// ---------------------------------------------------------------------------
// CSV primitives
// ---------------------------------------------------------------------------

const SEP = ";";
const BOM = "\uFEFF";

function csvField(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(fields: unknown[]): string {
  return fields.map(csvField).join(SEP);
}

/** DATEV date: TTMMJJJJ. Falls back to empty string on invalid input. */
export function formatDatevDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${m[3]}${m[2]}${m[1]}`;
}

/** German decimal formatting: 1234 cents -> "12,34". */
export function formatDatevAmount(cents: number): string {
  const n = Math.round(Number(cents) || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const euros = Math.floor(abs / 100).toString();
  const rest = (abs % 100).toString().padStart(2, "0");
  return `${sign}${euros},${rest}`;
}

// ---------------------------------------------------------------------------
// Line derivation — one booking line per source row
// ---------------------------------------------------------------------------

/** Reduced SKR03 chart of accounts commonly used by DE contractors. */
export const DATEV_ACCOUNTS = {
  wages: "4120", // Löhne
  travelKm: "4670", // Reisekosten Kfz (Arbeitnehmer)
  materials: "3400", // Wareneingang / Material
  otherExpense: "4980", // Sonstige betriebliche Aufwendungen
  bankClearing: "1200", // Bank
} as const;

export interface DatevBookingLine {
  amount: number; // cents (positive)
  debitCredit: "S" | "H"; // Soll/Haben
  accountNo: string; // Konto
  contraAccountNo: string; // Gegenkonto
  date: string; // ISO YYYY-MM-DD
  documentField: string; // Belegfeld 1
  vatKey?: string; // BU-Schlüssel (steuer)
  memo: string; // Buchungstext
  costCenter?: string; // KOST1 (job ref)
}

function hourLine(h: StaffHourEntry): DatevBookingLine {
  const amount = Math.round(h.hours * h.hourlyRateCents);
  return {
    amount,
    debitCredit: "S",
    accountNo: DATEV_ACCOUNTS.wages,
    contraAccountNo: DATEV_ACCOUNTS.bankClearing,
    date: h.workDate,
    documentField: `HRS-${h.workDate}`,
    memo: `Arbeitszeit ${h.staffName} ${h.hours.toFixed(2)}h`,
    costCenter: h.jobRef ?? undefined,
  };
}

function tripLine(t: TripEntry): DatevBookingLine {
  const rate = t.kmRateCents ?? 30;
  const amount = Math.round(t.km * rate);
  const route = t.fromAddress && t.toAddress ? `${t.fromAddress} -> ${t.toAddress}` : "Fahrt";
  return {
    amount,
    debitCredit: "S",
    accountNo: DATEV_ACCOUNTS.travelKm,
    contraAccountNo: DATEV_ACCOUNTS.bankClearing,
    date: t.tripDate,
    documentField: `KM-${t.tripDate}`,
    memo: `${route} ${t.km.toFixed(1)}km`,
    costCenter: t.jobRef ?? undefined,
  };
}

/** DATEV BU-Schlüssel (Steuerschlüssel) for common German VAT rates. */
function vatKeyFor(vatPercent: number): string | undefined {
  if (vatPercent === 19) return "9";
  if (vatPercent === 7) return "8";
  if (vatPercent === 0) return "0";
  return undefined;
}

function expenseLine(e: ExpenseEntry): DatevBookingLine {
  const acct = e.category === "material" ? DATEV_ACCOUNTS.materials : DATEV_ACCOUNTS.otherExpense;
  return {
    amount: e.grossCents,
    debitCredit: "S",
    accountNo: acct,
    contraAccountNo: DATEV_ACCOUNTS.bankClearing,
    date: e.expenseDate,
    documentField: `EXP-${e.expenseDate}`,
    vatKey: vatKeyFor(e.vatPercent),
    memo: `${e.vendor}${e.description ? ` — ${e.description}` : ""}`.slice(0, 60),
    costCenter: e.jobRef ?? undefined,
  };
}

export function buildBookingLines(input: DatevExportInput): DatevBookingLine[] {
  const lines: DatevBookingLine[] = [];
  for (const h of input.hours ?? []) lines.push(hourLine(h));
  for (const t of input.trips ?? []) lines.push(tripLine(t));
  for (const e of input.expenses ?? []) lines.push(expenseLine(e));
  // Sort by date to keep the Buchungsstapel chronological.
  lines.sort((a, b) => a.date.localeCompare(b.date));
  return lines;
}

// ---------------------------------------------------------------------------
// CSV assembly
// ---------------------------------------------------------------------------

/** Reduced 12-column DATEV Buchungsstapel header. */
const DATEV_HEADER = [
  "Umsatz",
  "Soll/Haben-Kennzeichen",
  "WKZ Umsatz",
  "Konto",
  "Gegenkonto",
  "BU-Schlüssel",
  "Belegdatum",
  "Belegfeld 1",
  "Buchungstext",
  "KOST1",
  "KOST2",
  "Steuer",
] as const;

export interface DatevExportResult {
  csv: string;
  filename: string;
  lineCount: number;
  totalCents: number;
}

/**
 * Main entry point: compile all Phase 5 tracking rows into a DATEV
 * Buchungsstapel CSV. UTF-8 with BOM so Excel/DATEV importers detect
 * German umlauts correctly.
 */
export function exportToDatevFormat(input: DatevExportInput): DatevExportResult {
  const lines = buildBookingLines(input);

  const metaRow = csvRow([
    `DATEV Buchungsstapel ${input.from} - ${input.to}`,
    "",
    "EUR",
    input.consultantNumber ?? "",
    input.clientNumber ?? "",
    "",
    "",
    "",
    "Handwerk local export",
    "",
    "",
    "",
  ]);
  const headerRow = csvRow(DATEV_HEADER as readonly unknown[] as unknown[]);

  const bodyRows = lines.map((l) =>
    csvRow([
      formatDatevAmount(l.amount),
      l.debitCredit,
      "EUR",
      l.accountNo,
      l.contraAccountNo,
      l.vatKey ?? "",
      formatDatevDate(l.date),
      l.documentField,
      l.memo,
      l.costCenter ?? "",
      "",
      l.vatKey ?? "",
    ]),
  );

  const csv = BOM + [metaRow, headerRow, ...bodyRows].join("\r\n") + "\r\n";
  const totalCents = lines.reduce((sum, l) => sum + l.amount, 0);
  const filename = `datev_${input.from}_${input.to}.csv`;

  return { csv, filename, lineCount: lines.length, totalCents };
}

/** Browser convenience: trigger a download for a DatevExportResult. */
export function downloadDatevCsv(result: DatevExportResult): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
