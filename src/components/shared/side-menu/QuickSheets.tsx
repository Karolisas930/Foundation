import { Calendar as CalendarIcon, Euro, FileText, PlusCircle, Radar, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { JobRadar } from "@/features/contractor/profile/components/toolbelt/JobRadar";

/** Full-height right drawer surfacing the Job Radar view. */
export function JobRadarSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-2xl flex-col gap-0 border-l border-white/10 bg-[#0f172a] p-0 text-slate-50 sm:w-[92%]"
      >
        <SheetTitle className="sr-only">Job Radar</SheetTitle>
        <SheetDescription className="sr-only">
          Trending jobs and opportunities in your area.
        </SheetDescription>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Radar className="h-5 w-5 text-orange-glow" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight text-white">Job Radar</p>
              <p className="text-xs text-white/55">Trending jobs in your area</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <JobRadar />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Bottom sheet with the quick off-platform Finanz entry form. */
export function QuickFinanceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92vh] flex-col gap-0 rounded-t-3xl border-t border-white/10 bg-[#0f172a] p-0 text-slate-50"
      >
        <SheetTitle className="sr-only">Quick Financial Entry</SheetTitle>
        <SheetDescription className="sr-only">
          Log an off-platform project or invoice for your books.
        </SheetDescription>

        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20" />

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <PlusCircle className="h-5 w-5 text-white/85" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-white">
                Quick Financial Entry
              </p>
              <p className="text-xs text-white/55">Off-platform project or invoice</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="h-px bg-white/10" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Entry saved to your Finanz ledger");
            onOpenChange(false);
          }}
          className="flex flex-col gap-4 overflow-y-auto px-5 py-5"
        >
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} /> Description
            </span>
            <Input
              required
              placeholder="e.g. Kitchen renovation — Weber family"
              className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                <Euro className="h-3.5 w-3.5" strokeWidth={1.5} /> Amount
              </span>
              <Input
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.5} /> Date
              </span>
              <Input
                required
                type="date"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Notes
            </span>
            <Textarea
              rows={3}
              placeholder="Materials, hours, VAT class…"
              className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Save Entry
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
