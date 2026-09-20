import { FileText, Plus, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Zero-quotes is the state a brand-new tradesperson sees first, so it has to
 * teach the flow rather than just report emptiness: find a job, quote it, the
 * homeowner sees it as a real bid.
 */
export function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  if (hasAny) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
        <Search className="mx-auto h-8 w-8 text-slate-500" aria-hidden />
        <h3 className="mt-3 text-sm font-semibold text-slate-100">No quotes match</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
          Try clearing the filters or the search box above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-300">
        <FileText className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-bold text-white">No quotes yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Every quote you send lands on the homeowner's dashboard as a real offer. Start with an open
        job near you.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button
          onClick={onCreate}
          className="bg-gradient-to-b from-orange-500 to-orange-600 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Quote
        </Button>
        <Button asChild variant="outline" className="border-white/15 text-slate-100">
          <Link to="/contractor/jobs/active">Browse open jobs</Link>
        </Button>
      </div>
      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-xs text-slate-400">
        {[
          "Pick the job you want to quote for.",
          "Add your line items — materials, labour, VAT.",
          "Send it; the homeowner can accept straight away.",
        ].map((hint, i) => (
          <li key={hint} className="flex gap-2">
            <span className="mt-[2px] flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-200">
              {i + 1}
            </span>
            <span>{hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
