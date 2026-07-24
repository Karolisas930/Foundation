/**
 * Bottom DATEV CSV + printable PDF export buttons.
 */
import { Download, FileText } from "lucide-react";
import { exportDatevCsv, exportPdfSummary, type ExportArgs } from "./tax-calc";

export function TaxExportsSection({ args }: { args: ExportArgs }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-2 px-6 pt-5">
        <button
          type="button"
          onClick={() => exportDatevCsv(args)}
          className="flex items-center justify-center gap-2 rounded-full border border-orange/50 bg-orange px-3 py-3 text-xs font-semibold text-navy-ink transition hover:bg-orange/90"
        >
          <Download className="size-4" strokeWidth={1.75} />
          DATEV CSV
        </button>
        <button
          type="button"
          onClick={() => exportPdfSummary(args)}
          className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-3 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
        >
          <FileText className="size-4" strokeWidth={1.75} />
          PDF summary
        </button>
      </section>
      <p className="px-6 pt-2 text-center text-[11px] text-white/45">
        Includes overview, invoices, receipts and trips for {args.periodLabel}.
      </p>
    </>
  );
}
