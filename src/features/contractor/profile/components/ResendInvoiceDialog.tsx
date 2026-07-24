/**
 * ResendInvoiceDialog — Mode picker for resending an invoice email.
 *
 * Two options:
 *  1. Quick send via the platform's Resend relay (immediate).
 *  2. Connect the contractor's own mailbox (Gmail / Outlook / custom SMTP)
 *     for future sends. This shows a friendly "coming soon" toast today and
 *     leaves the wiring point ready for a per-user OAuth flow.
 */
import { useState } from "react";
import { Loader2, Mail, PlugZap, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ResendInvoiceTarget = {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
};

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

export function ResendInvoiceDialog({
  open,
  onOpenChange,
  target,
  sending,
  onQuickSend,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: ResendInvoiceTarget | null;
  sending: boolean;
  onQuickSend: () => void | Promise<void>;
}) {
  const [connecting, setConnecting] = useState(false);

  const handleConnectOwn = async () => {
    setConnecting(true);
    // Placeholder — a future turn wires per-user OAuth (Gmail / Outlook) or
    // a custom SMTP setup screen. Keep the UX intact today.
    await new Promise((r) => setTimeout(r, 350));
    setConnecting(false);
    toast.info("Eigenes E-Mail-Konto verbinden", {
      description:
        "Gmail, Outlook und eigenes SMTP folgen in Kürze. Aktuell versenden wir zuverlässig über die Plattform.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[oklch(0.18_0.02_260/0.98)] p-0 text-white backdrop-blur">
        <DialogHeader className="border-b border-white/10 px-6 pt-6 pb-4">
          <DialogTitle className="font-display flex items-center gap-2 text-lg text-white">
            <Mail className="size-5 text-orange" />
            Rechnung per E-Mail senden
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {target ? (
              <>
                <span className="font-semibold text-slate-200">#{target.invoiceNumber}</span> ·{" "}
                {target.clientName} · {fmtEUR(target.total)}
              </>
            ) : (
              "Wählen Sie einen Versandweg"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-5">
          <button
            type="button"
            onClick={() => void onQuickSend()}
            disabled={sending}
            className="group relative flex w-full items-start gap-3 rounded-2xl border border-orange/40 bg-gradient-to-br from-orange/[0.14] to-orange/[0.04] p-4 text-left transition hover:border-orange/60 hover:from-orange/[0.20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange/20 text-orange ring-1 ring-inset ring-orange/40">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                Sofort senden
                <span className="rounded-full bg-orange/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-100 ring-1 ring-inset ring-orange/40">
                  Empfohlen
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                Sichere Zustellung über unseren Plattform-Relay (Resend). Kein Setup nötig —
                Rechnung ist in Sekunden beim Kunden.
              </span>
            </span>
            <Sparkles className="mt-1 size-4 shrink-0 text-orange/80" />
          </button>

          <button
            type="button"
            onClick={() => void handleConnectOwn()}
            disabled={connecting}
            className="group relative flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15">
              {connecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlugZap className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                Eigenes E-Mail-Konto verbinden
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 ring-1 ring-inset ring-white/15">
                  Bald
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                Gmail, Outlook oder eigener SMTP-Server. Rechnungen kommen dann direkt aus Ihrem
                Postfach — inkl. Antworten im Posteingang.
              </span>
            </span>
          </button>

          <p className="pt-1 text-center text-[11px] text-slate-500">
            § 35a EStG-konform · Arbeit/Material getrennt ausgewiesen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
