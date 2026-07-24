/**
 * TaxToolsSheet — coordinator. Wires data + computations + sub-panels.
 */
import { useState } from "react";
import { Inbox, Loader2, Scale, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Chip } from "./tax-tools/TaxToolsUi";
import { TaxQuarterlyChart } from "./tax-tools/TaxQuarterlyChart";
import { TaxDeductionSummary } from "./tax-tools/TaxDeductionSummary";
import { TaxVatFields } from "./tax-tools/TaxVatFields";
import { TaxExportsSection } from "./tax-tools/TaxExportsSection";
import { useTaxData } from "./tax-tools/useTaxData";
import { QUARTERS, useTaxComputations, type QuarterKey } from "./tax-tools/tax-calc";

export function TaxToolsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { loading, invoices, receipts, trips, settings } = useTaxData(open, userId);

  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState<QuarterKey>("all");

  const c = useTaxComputations(invoices, receipts, trips, settings, year, quarter, loading);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[94vh] overflow-y-auto border-white/10 bg-[#0f172a] p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Scale className="size-5 text-orange" strokeWidth={1.5} />
            Tax Tools
          </SheetTitle>
          <SheetDescription>VAT, profit and mileage allowance — at a glance.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {c.availableYears.map((y) => (
              <Chip key={y} active={year === y} onClick={() => setYear(y)}>
                {y}
              </Chip>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUARTERS.map((q) => (
              <Chip key={q.key} active={quarter === q.key} onClick={() => setQuarter(q.key)}>
                {q.label}
              </Chip>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" /> Loading data…
          </div>
        )}

        {!loading && (
          <>
            <TaxDeductionSummary
              revenueNet={c.revenueNet}
              expensesNet={c.expensesNet}
              profit={c.profit}
              vatPaid={c.vatPaid}
              vatCollected={c.vatCollected}
              vatBalance={c.vatBalance}
              reserveNeeded={c.reserveNeeded}
              kmTotal={c.kmTotal}
              kmDeduction={c.kmDeduction}
              settings={settings}
              periodInvoicesCount={c.periodInvoices.length}
              periodReceiptsCount={c.periodReceipts.length}
              periodTripsCount={c.periodTrips.length}
              periodLabel={c.periodLabel}
              year={year}
              deadlines={c.deadlines}
            />
            <TaxQuarterlyChart chartData={c.chartData} periodLabel={c.periodLabel} />
            <TaxVatFields
              vatCollected={c.vatCollected}
              vatPaid={c.vatPaid}
              vatBalance={c.vatBalance}
            />

            {c.isEmpty && (
              <section className="px-6 pt-5">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                  <Inbox className="size-8 text-white/40" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-white/80">
                    No data yet for {c.periodLabel}
                  </p>
                  <p className="max-w-xs text-xs text-white/50">
                    Create invoices, add receipts or log trips — the breakdown will appear here
                    automatically.
                  </p>
                </div>
              </section>
            )}

            <TaxExportsSection
              args={{
                periodLabel: c.periodLabel,
                periodInvoices: c.periodInvoices,
                periodReceipts: c.periodReceipts,
                periodTrips: c.periodTrips,
                settings,
                revenueNet: c.revenueNet,
                vatCollected: c.vatCollected,
                expensesNet: c.expensesNet,
                vatPaid: c.vatPaid,
                vatBalance: c.vatBalance,
                kmTotal: c.kmTotal,
                kmDeduction: c.kmDeduction,
                profit: c.profit,
              }}
            />
          </>
        )}

        <div className="px-6 pb-8 pt-6">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" strokeWidth={1.5} /> Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
