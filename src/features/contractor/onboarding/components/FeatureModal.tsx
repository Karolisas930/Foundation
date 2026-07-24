/**
 * FeatureModal — glassmorphic dialog wrapper for individual tool/feature panels.
 *
 * Renders a large centered dialog with a close button, navy/orange glass styling,
 * and a scrollable body. Used by HandymanProfilePage to open one feature at a time.
 */
import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface FeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}

export function FeatureModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
}: FeatureModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-5xl w-[96vw] max-h-[92vh] p-0 gap-0 overflow-hidden
          border border-white/15 bg-[#0f172a]/85 backdrop-blur-2xl
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]
          text-slate-100 rounded-2xl
          [&>button]:hidden
        "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange/10 via-transparent to-sky-400/5"
        />

        <DialogHeader className="relative z-10 flex-row items-start justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4 sm:px-6 space-y-0">
          <div className="flex items-start gap-3 min-w-0">
            {Icon ? (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange ring-1 ring-orange/30">
                <Icon className="size-5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg sm:text-xl font-bold text-white truncate">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-400">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
          </div>
          <DialogClose
            aria-label="Close"
            className="shrink-0 grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-orange/40 hover:bg-orange/10 hover:text-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
          >
            <X className="size-4" />
          </DialogClose>
        </DialogHeader>

        <div className="relative z-10 overflow-y-auto px-2 py-4 sm:px-4 sm:py-5 max-h-[calc(92vh-72px)]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
