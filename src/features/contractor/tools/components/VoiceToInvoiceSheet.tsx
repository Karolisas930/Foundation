/**
 * VoiceToInvoiceSheet — coordinator. Owns nothing but layout; delegates
 * state to `useVoiceInvoice` and rendering to the three extracted panels.
 */
import { Mic } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToolbeltStyles } from "./ToolbeltStyles";
import { useVoiceInvoice } from "./voice-invoice/useVoiceInvoice";
import { VoiceRecorderPanel } from "./voice-invoice/VoiceRecorderPanel";
import { VoiceDraftEditor } from "./voice-invoice/VoiceDraftEditor";
import { VoiceInvoicePreviewDialog } from "./voice-invoice/VoiceInvoicePreviewDialog";

export function VoiceToInvoiceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const s = useVoiceInvoice(open, onOpenChange);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto border-white/10 bg-[#0f172a] p-0"
      >
        <ToolbeltStyles />
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Mic className="size-5 text-orange" strokeWidth={1.5} /> Voice to Invoice
          </SheetTitle>
          <SheetDescription>
            Speak your quote — we transcribe it and build an editable draft with billing, surcharges
            & VAT.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-10 pt-4">
          <VoiceRecorderPanel s={s} />
          <VoiceDraftEditor s={s} />
        </div>
      </SheetContent>

      <VoiceInvoicePreviewDialog s={s} />
    </Sheet>
  );
}
