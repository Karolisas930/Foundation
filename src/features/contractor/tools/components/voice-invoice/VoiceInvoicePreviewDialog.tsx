/**
 * Final invoice preview dialog — a printable layout of the generated draft.
 */
import { Eye, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SURCHARGE_META, fmtEur, type SurchargeKey } from "./voice-invoice-shared";
import type { VoiceInvoiceState } from "./useVoiceInvoice";

export function VoiceInvoicePreviewDialog({ s }: { s: VoiceInvoiceState }) {
  return (
    <Dialog open={s.showPreview} onOpenChange={s.setShowPreview}>
      <DialogContent className="max-w-lg border-white/10 bg-[#0f172a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Eye className="size-4 text-orange" strokeWidth={1.5} /> Invoice Preview
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Review before sending. Nothing is sent yet.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-lg bg-white p-6 text-slate-900 shadow-inner">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-lg font-bold">{s.company.companyName || "Your Company"}</div>
              <div className="whitespace-pre-line text-[11px] text-slate-500">
                {[
                  s.company.address,
                  [s.company.postalCode, s.company.city].filter(Boolean).join(" "),
                ]
                  .filter(Boolean)
                  .join("\n")}
              </div>
              {s.company.email && (
                <div className="text-[11px] text-slate-500">{s.company.email}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400">Invoice</div>
              <div className="text-[11px] text-slate-500">
                {new Date().toISOString().slice(0, 10)}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Bill to</div>
            <div className="text-sm font-medium">{s.clientName || "—"}</div>
            <div className="whitespace-pre-line text-[11px] text-slate-500">
              {[s.clientStreet, [s.clientPostcode, s.clientCity].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join("\n")}
            </div>
            {s.sendEmail && <div className="text-[11px] text-slate-500">{s.sendEmail}</div>}
          </div>
          <div className="mt-4 whitespace-pre-line rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px]">
            {s.transcript.trim() || "—"}
          </div>
          <div className="mt-4 space-y-1.5 text-[13px]">
            {s.billingMode === "hourly" && (
              <div className="flex justify-between">
                <span>
                  {s.parsedHours} h × {fmtEur(s.parsedRate)}
                </span>
                <span>{fmtEur(s.baseAmount)}</span>
              </div>
            )}
            {s.billingMode === "fixed" && (
              <div className="flex justify-between">
                <span>Base amount</span>
                <span>{fmtEur(s.baseAmount)}</span>
              </div>
            )}
            {s.anySurcharge && (
              <div className="flex justify-between text-orange-600">
                <span>
                  Surcharge (
                  {(Object.keys(s.surcharges) as SurchargeKey[])
                    .filter((k) => s.surcharges[k])
                    .map((k) => SURCHARGE_META[k].short)
                    .join(", ")}
                  ) +{s.surchargePct}%
                </span>
                <span>+{fmtEur(s.surchargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span>Net</span>
              <span>{fmtEur(s.netAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>{s.vatMode === "0" ? "VAT 0% (Reverse Charge)" : `VAT ${s.vatRate}%`}</span>
              <span>{fmtEur(s.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{fmtEur(s.totalGross)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => s.setShowPreview(false)}
            className="rounded-full border-white/20 text-white hover:border-orange/60 hover:text-orange"
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={s.sending || !s.emailValid}
            onClick={() => {
              s.setShowPreview(false);
              s.handleSend();
            }}
            className="btn-glow btn-glow-hover rounded-full"
          >
            <Send className="mr-2 size-4" strokeWidth={1.5} /> Send Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
