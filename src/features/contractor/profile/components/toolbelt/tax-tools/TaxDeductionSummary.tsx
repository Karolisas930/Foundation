/**
 * Hero KPIs + insights + KM allowance + deadlines summary.
 */
import {
  BellRing,
  Gauge,
  Landmark,
  PiggyBank,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DeadlineRow, HeroKpi, InsightCard, SectionHeading } from "./TaxToolsUi";
import { fmtEuro, fmtEuroCompact, type DbSettings } from "./tax-calc";

interface Props {
  revenueNet: number;
  expensesNet: number;
  profit: number;
  vatPaid: number;
  vatCollected: number;
  vatBalance: number;
  reserveNeeded: number;
  kmTotal: number;
  kmDeduction: number;
  settings: DbSettings;
  periodInvoicesCount: number;
  periodReceiptsCount: number;
  periodTripsCount: number;
  periodLabel: string;
  year: number;
  deadlines: Array<{ date: Date; title: string; kind: "vat" | "income"; daysAway: number }>;
}

export function TaxDeductionSummary(p: Props) {
  return (
    <>
      <section className="px-6 pt-5">
        <div className="grid grid-cols-3 gap-2.5">
          <HeroKpi
            label="Revenue"
            value={fmtEuroCompact(p.revenueNet)}
            hint={`${p.periodInvoicesCount} invoices`}
            tone="pos"
            icon={TrendingUp}
          />
          <HeroKpi
            label="Expenses"
            value={fmtEuroCompact(p.expensesNet)}
            hint={`${p.periodReceiptsCount} receipts`}
            tone="neg"
            icon={TrendingDown}
          />
          <HeroKpi
            label="Profit"
            value={fmtEuroCompact(p.profit)}
            hint="net, pre-tax"
            tone={p.profit >= 0 ? "pos" : "warn"}
            icon={PiggyBank}
          />
        </div>
      </section>

      <section className="px-6 pt-5">
        <SectionHeading icon={Sparkles}>Insights</SectionHeading>
        <div className="mt-2 grid gap-2">
          <InsightCard
            icon={Receipt}
            tone="info"
            title={`${fmtEuro(p.vatPaid)} input VAT refundable`}
            body={`From ${p.periodReceiptsCount} receipts in ${p.periodLabel}. You can offset this against your VAT liability.`}
          />
          <InsightCard
            icon={Landmark}
            tone={p.vatBalance >= 0 ? "warn" : "pos"}
            title={
              p.vatBalance >= 0
                ? `VAT payable: ${fmtEuro(p.vatBalance)} to tax office`
                : `VAT refund: ${fmtEuro(Math.abs(p.vatBalance))} from tax office`
            }
            body={`Collected ${fmtEuro(p.vatCollected)} − Input VAT ${fmtEuro(p.vatPaid)}`}
          />
          <InsightCard
            icon={PiggyBank}
            tone="pos"
            title={`Recommended tax reserve: ${fmtEuro(p.reserveNeeded)}`}
            body={`${p.settings.reserve_percent}% of your profit (${fmtEuro(p.profit)}) — set this aside for income tax.`}
          />
        </div>
      </section>

      <section className="px-6 pt-5">
        <SectionHeading icon={Gauge}>Mileage allowance</SectionHeading>
        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-display text-2xl font-bold text-white">
                {p.kmTotal.toLocaleString("en-GB")} km
              </p>
              <p className="text-[11px] text-white/45">
                {p.periodTripsCount} trip{p.periodTripsCount === 1 ? "" : "s"} ·{" "}
                {p.settings.km_rate_cents} ct/km
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-orange">
                {fmtEuroCompact(p.kmDeduction)}
              </p>
              <p className="text-[11px] text-white/45">deductible (§ 9 EStG)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pt-5">
        <SectionHeading icon={BellRing}>Upcoming deadlines</SectionHeading>
        <ul className="mt-2 space-y-2">
          {p.deadlines.length === 0 && (
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-sm text-white/50">
              No upcoming deadlines for {p.year}.
            </li>
          )}
          {p.deadlines.map((d) => (
            <DeadlineRow key={d.title} {...d} />
          ))}
        </ul>
      </section>
    </>
  );
}
