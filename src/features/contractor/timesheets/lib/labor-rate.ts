/**
 * Phase 5 — pure labor/km/expense math helpers.
 *
 * Isolated from React so callers (Pay tab, reports, tests, exports) can
 * reuse the same rounding rules. All money is EUR to two decimals.
 */
import type { HoursRow } from "../components/staff-hours-utils";

export interface StaffPayRow {
  id: string;
  name: string;
  hours: number;
  rate: number;
  gross: number;
}

export interface LaborCostSummary {
  list: StaffPayRow[];
  totalHours: number;
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute gross labor cost per staff member from APPROVED hours × hourly rate.
 * Non-approved rows are ignored so payroll never runs against pending time.
 */
export function computeLaborCost(
  rows: HoursRow[],
  staff: { id: string; name: string }[],
  rates: Record<string, number>,
): LaborCostSummary {
  const perStaff = new Map<string, { id: string; name: string; hours: number }>();
  for (const s of staff) perStaff.set(s.id, { id: s.id, name: s.name, hours: 0 });
  for (const r of rows) {
    if (r.status !== "approved") continue;
    const cur = perStaff.get(r.member_id) ?? {
      id: r.member_id,
      name: r.member_name ?? r.member_id,
      hours: 0,
    };
    cur.hours += Number(r.hours) || 0;
    perStaff.set(r.member_id, cur);
  }
  const list: StaffPayRow[] = Array.from(perStaff.values())
    .map((s) => {
      const rate = Number(rates[s.id]) || 0;
      const hours = round2(s.hours);
      return { ...s, hours, rate, gross: round2(hours * rate) };
    })
    .sort((a, b) => b.gross - a.gross);
  const total = round2(list.reduce((sum, s) => sum + s.gross, 0));
  const totalHours = round2(list.reduce((sum, s) => sum + s.hours, 0));
  return { list, total, totalHours };
}

/**
 * Kilometer deduction (Finanzamt rate is stored in cents-per-km on
 * `finanz_settings.km_rate_cents`; defaults to 30 ct/km).
 */
export function computeKmDeduction(totalKm: number, kmRateCents: number): number {
  return round2(((Number(totalKm) || 0) * (Number(kmRateCents) || 0)) / 100);
}

export interface ExpenseLineItem {
  amount_cents: number;
  category?: string | null;
}

/** Sum expense line-items in EUR by category, plus grand total. */
export function summarizeExpenses(items: ExpenseLineItem[]): {
  byCategory: Record<string, number>;
  total: number;
} {
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const it of items) {
    const cents = Number(it.amount_cents) || 0;
    total += cents;
    const key = (it.category ?? "other").toLowerCase();
    byCategory[key] = (byCategory[key] ?? 0) + cents;
  }
  return {
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, round2(v / 100)]),
    ),
    total: round2(total / 100),
  };
}
