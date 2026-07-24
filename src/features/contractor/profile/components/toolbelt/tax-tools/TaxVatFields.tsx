/**
 * VAT breakdown — collected, paid, balance — for the current period.
 */
import { Landmark } from "lucide-react";
import { fmtEuroCompact } from "./tax-calc";
import { SectionHeading, StatCard } from "./TaxToolsUi";

interface Props {
  vatCollected: number;
  vatPaid: number;
  vatBalance: number;
}

export function TaxVatFields({ vatCollected, vatPaid, vatBalance }: Props) {
  return (
    <section className="px-6 pt-5">
      <SectionHeading icon={Landmark}>VAT</SectionHeading>
      <div className="mt-2 grid grid-cols-3 gap-2.5">
        <StatCard label="Collected" value={fmtEuroCompact(vatCollected)} hint="from invoices" />
        <StatCard label="Paid" value={fmtEuroCompact(vatPaid)} hint="input VAT" />
        <StatCard
          label="Balance"
          value={fmtEuroCompact(vatBalance)}
          hint={vatBalance >= 0 ? "payable" : "refund"}
          accent={vatBalance >= 0 ? "text-orange" : "text-emerald-300"}
        />
      </div>
    </section>
  );
}
