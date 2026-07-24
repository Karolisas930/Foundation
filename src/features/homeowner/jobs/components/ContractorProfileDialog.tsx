/**
 * ContractorProfileDialog — modal quick-view of a contractor's company
 * (used when the bid has no public profileId link).
 */
import { Award, Building2, MapPin, MessageSquare, Star } from "lucide-react";
import type { EcosystemProposal } from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMatchScore } from "../../dashboard/components/parts/helpers";
import { ProfileStat } from "../../dashboard/components/parts/ProfileStat";

export function ContractorProfileDialog({
  bid,
  onClose,
  onMessage,
}: {
  bid: EcosystemProposal | null;
  onClose: () => void;
  onMessage: (bid: EcosystemProposal) => void;
}) {
  return (
    <Dialog open={!!bid} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {bid && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange to-orange/60 text-white ring-1 ring-orange/50">
                  <Building2 className="size-5" />
                </span>
                <span className="font-display text-lg font-extrabold">{bid.company}</span>
              </DialogTitle>
              <DialogDescription>Verified contractor on the HANDWERK network.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2">
              <ProfileStat icon={Star} label="Rating" value={bid.rating.toFixed(1)} />
              <ProfileStat icon={Award} label="Match" value={`${getMatchScore(bid.id)}%`} />
              <ProfileStat icon={MapPin} label="Base" value={bid.city ?? "—"} />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Specialised crew, insured, German/English-speaking. Available across Baden-Württemberg
              with rapid quote turnaround and on-site QA after completion.
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onMessage(bid)} className="bg-orange hover:bg-orange/90">
                <MessageSquare className="mr-1.5 size-4" /> Message
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
