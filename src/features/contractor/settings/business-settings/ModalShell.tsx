/**
 * ModalShell — shared bottom-sheet chrome for every Business Settings modal.
 */
import { X, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export function ModalShell({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  icon: typeof Mail;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92vh] flex-col gap-0 rounded-t-3xl border-t border-white/10 bg-[#0f172a] p-0 text-slate-50"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{subtitle}</SheetDescription>

        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20" />

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Icon className="h-5 w-5 text-white/85" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-white">{title}</p>
              <p className="text-xs text-white/55">{subtitle}</p>
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

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
      {children}
    </span>
  );
}

export const inputCls = "border-white/10 bg-white/[0.04] text-white placeholder:text-white/35";
