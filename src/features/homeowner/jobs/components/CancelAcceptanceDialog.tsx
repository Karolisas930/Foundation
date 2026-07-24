/**
 * CancelAcceptanceDialog — confirmation modal for cancelling a previously
 * accepted bid. Requires a 10+ character reason before enabling confirm.
 */
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function CancelAcceptanceDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="size-5" />
            Cancel accepted bid?
          </DialogTitle>
          <DialogDescription>
            This will notify the contractor and re-open the project for new bids.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/5 p-3 text-xs leading-5 text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Frequent cancellations affect your trust score. Any scheduled site visits will be
            cleared.
          </span>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Reason (required, 10+ chars)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value.slice(0, 500))}
            placeholder="e.g. Found a better fit, change of scope, timing issue…"
            rows={4}
            maxLength={500}
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {reason.trim().length}/500
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep contractor
          </Button>
          <Button
            onClick={onConfirm}
            disabled={reason.trim().length < 10}
            className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            <X className="mr-1.5 size-4" /> Confirm cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
