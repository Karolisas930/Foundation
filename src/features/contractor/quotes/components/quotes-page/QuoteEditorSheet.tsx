import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Quote } from "@/features/contractor/quotes/quotes-store";
import type { QuoteSource, Prefill } from "./constants";
import { SourcePicker } from "./SourcePicker";
import { QuoteForm } from "./QuoteForm";

export function QuoteEditorSheet({
  open,
  quote,
  onClose,
}: {
  open: boolean;
  quote: Quote | null;
  onClose: () => void;
}) {
  const [source, setSource] = useState<QuoteSource | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  const keySeed = quote?.id ?? "new";

  const handleClose = () => {
    setSource(null);
    setPrefill(null);
    onClose();
  };

  const chooseSource = (s: QuoteSource, p?: Prefill) => {
    setSource(s);
    setPrefill(p ?? null);
  };

  const showPicker = !quote && source === null;

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : handleClose())}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-white/10 bg-[#0f172a] p-0 text-slate-50 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            {!quote && source !== null && (
              <button
                type="button"
                onClick={() => {
                  setSource(null);
                  setPrefill(null);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Back to source picker"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {quote ? `Edit ${quote.number}` : "New Quote"}
          </SheetTitle>
          <SheetDescription className="text-slate-300">
            {quote
              ? "Update line items, notes, or client info."
              : showPicker
                ? "Start from a marketplace lead, a matched client, or from scratch."
                : prefill?.sourceLabel
                  ? `Prefilled from ${prefill.sourceLabel}. Review and send.`
                  : "Fast quote — pick a client, add items, send."}
          </SheetDescription>
        </SheetHeader>

        {showPicker ? (
          <SourcePicker onPick={chooseSource} />
        ) : (
          <QuoteForm
            key={`${keySeed}:${source ?? "edit"}`}
            quote={quote}
            prefill={prefill}
            onDone={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
