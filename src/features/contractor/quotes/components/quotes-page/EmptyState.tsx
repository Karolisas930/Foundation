import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
      <FileText className="mx-auto h-8 w-8 text-slate-500" aria-hidden />
      <h3 className="mt-3 text-sm font-semibold text-slate-100">
        {hasAny ? "No quotes match" : "No quotes yet"}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
        {hasAny
          ? "Try clearing the filters or search."
          : "Draft a fast quote — pick a client, add line items, send."}
      </p>
      {!hasAny && (
        <Button
          onClick={onCreate}
          className="mt-4 bg-gradient-to-b from-orange-500 to-orange-600 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Quote
        </Button>
      )}
    </div>
  );
}
