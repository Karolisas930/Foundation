/**
 * MeisterDialog — one-shot notice that fires the first time a regulated
 * German trade is selected. Purely presentational.
 */
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  trade: string | null;
  onClose: () => void;
}

export function MeisterDialog({ trade, onClose }: Props) {
  return (
    <Dialog open={trade !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-orange/10">
            <AlertTriangle className="size-5 text-orange" />
          </div>
          <DialogTitle>Meisterpflicht notice</DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-medium text-foreground">{trade}</span> is a regulated trade in
            Germany (Meisterpflicht). You can continue without documents now — upload your
            Handwerkskarte later from your profile to earn the verified badge and unlock
            higher-value jobs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Got it, continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
