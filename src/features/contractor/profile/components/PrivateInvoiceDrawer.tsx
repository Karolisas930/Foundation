/**
 * PrivateInvoiceDrawer — External Private Client Invoice Generator.
 *
 * Sits inside the Quick Financial Entry flow (Finanz tab). Collects labor +
 * material amounts, dispatches a compliant German invoice email, logs the
 * transaction as `external_private`, and feeds the labor portion into the
 * 30% Finanzamt reserve tracker on the dashboard.
 */
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, Sparkles, Send, User, Euro, Hammer, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { sendPrivateInvoice } from "@/features/contractor/profile/private-invoice.functions";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

export type PrivateInvoicePrefill = {
  clientName?: string;
  laborAmount?: number;
  materialAmount?: number;
};

export type PrivateInvoiceRecord = {
  clientName: string;
  clientEmail: string;
  laborAmount: number;
  materialAmount: number;
  total: number;
  reserveDelta: number;
  ts: number;
  invoiceNumber: string;
};

const glassInput =
  "w-full rounded-xl border border-white/10 bg-[oklch(0.14_0.02_260/0.6)] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 backdrop-blur focus-visible:border-orange/60 focus-visible:ring-2 focus-visible:ring-orange/40";

export function PrivateInvoiceDrawer({
  open,
  onOpenChange,
  contractorName,
  prefill,
  onInvoiced,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contractorName: string;
  prefill?: PrivateInvoicePrefill;
  onInvoiced: (record: PrivateInvoiceRecord) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [laborStr, setLaborStr] = useState("");
  const [materialStr, setMaterialStr] = useState("");
  const [sending, setSending] = useState(false);

  const sendInvoice = useServerFn(sendPrivateInvoice);

  // Prefill each time the drawer opens (e.g. from voice dictation).
  useEffect(() => {
    if (!open) return;
    setClientName(prefill?.clientName ?? "");
    setClientEmail("");
    setLaborStr(prefill?.laborAmount != null ? String(prefill.laborAmount) : "");
    setMaterialStr(prefill?.materialAmount != null ? String(prefill.materialAmount) : "");
    setSending(false);
  }, [open, prefill]);

  const labor = Number.parseFloat(laborStr.replace(",", ".")) || 0;
  const material = Number.parseFloat(materialStr.replace(",", ".")) || 0;
  const total = useMemo(() => labor + material, [labor, material]);
  const reserveDelta = useMemo(() => Math.round(labor * 0.3 * 100) / 100, [labor]);

  const canSubmit =
    clientName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim()) &&
    total > 0 &&
    !sending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    const toastId = toast.loading("Rechnung wird versendet…");
    try {
      const result = await sendInvoice({
        data: {
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim(),
          laborAmount: labor,
          materialAmount: material,
          contractorName,
        },
      });
      toast.dismiss(toastId);
      toast.success("Rechnung erfolgreich versendet", {
        description:
          result.provider === "resend"
            ? `An ${clientEmail} · ${fmtEUR(total)} · 30% Finanzamt-Rücklage aktualisiert`
            : `Vorschau erstellt · ${fmtEUR(total)} · E-Mail-Relay noch nicht konfiguriert`,
      });
      onInvoiced({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        laborAmount: labor,
        materialAmount: material,
        total,
        reserveDelta,
        ts: Date.now(),
        invoiceNumber: result.invoiceNumber,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("[private-invoice] send failed", err);
      toast.dismiss(toastId);
      toast.error("Rechnung konnte nicht versendet werden", {
        description: err instanceof Error ? err.message : "Bitte erneut versuchen.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-display flex items-center gap-2 text-xl text-white">
              <Mail className="size-5 text-orange" />
              Rechnung an Privatkunden senden
            </DrawerTitle>
            <DrawerDescription className="text-slate-400">
              Erstellt eine § 35a-konforme Rechnung, versendet sie automatisch und aktualisiert Ihre
              Finanzamt-Rücklage in Echtzeit.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2 sm:px-6">
            {/* Voice-hint banner */}
            <div className="flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/[0.08] px-3 py-2.5 text-[12px] leading-snug text-orange-100">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-orange" />
              <p>
                Tipp: Sagen Sie z.B.{" "}
                <em>„Rechnung an Thomas, 300 Euro Arbeit, 50 Euro Material“</em> — die Felder werden
                automatisch ausgefüllt.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <User className="size-3.5" /> Kundenname
                </span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="z.B. Thomas Müller"
                  className={glassInput}
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Mail className="size-3.5" /> Kunden-E-Mail
                </span>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="kunde@example.de"
                  className={glassInput}
                  autoComplete="off"
                  inputMode="email"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Hammer className="size-3.5 text-orange" /> Arbeitslohn (€)
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={laborStr}
                    onChange={(e) => setLaborStr(e.target.value)}
                    placeholder="0,00"
                    className={`${glassInput} pr-9 text-base font-semibold`}
                  />
                  <Euro className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">
                  § 35a EStG absetzbar · fließt in Finanzamt-Rücklage
                </span>
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Package className="size-3.5 text-orange" /> Materialkosten (€)
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={materialStr}
                    onChange={(e) => setMaterialStr(e.target.value)}
                    placeholder="0,00"
                    className={`${glassInput} pr-9 text-base font-semibold`}
                  />
                  <Euro className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
            </div>

            {/* Live totals + reserve preview (glassmorphic) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Arbeit</div>
                  <div className="mt-0.5 font-semibold text-white">{fmtEUR(labor)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Material
                  </div>
                  <div className="mt-0.5 font-semibold text-white">{fmtEUR(material)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Gesamt</div>
                  <div className="mt-0.5 font-bold text-orange">{fmtEUR(total)}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-2 text-[12px]">
                <span className="text-emerald-100">30% Finanzamt-Rücklage (Arbeit)</span>
                <span className="font-bold text-emerald-300">+ {fmtEUR(reserveDelta)}</span>
              </div>

              {/* Provisional platform fee row — Founders 0% promotional window */}
              <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-1.5 text-emerald-100"
                    title="Premium Handwerker Start-Aktion: Als Erstpartner nutzen Sie unser Netzwerk die ersten Monate völlig kostenlos!"
                  >
                    Plattform-Gebühr (Founders 0%)
                    <span
                      aria-label="Premium Handwerker Start-Aktion: Als Erstpartner nutzen Sie unser Netzwerk die ersten Monate völlig kostenlos!"
                      className="grid size-4 place-items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-[9px] font-bold text-emerald-200"
                    >
                      i
                    </span>
                  </span>
                  <span className="font-bold text-emerald-300">
                    − {fmtEUR(Math.round(total * 0.07 * 100) / 100)}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-200/70">
                  Provisional · normal 7% waived during launch window
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="relative min-h-14 w-full rounded-2xl bg-gradient-to-b from-orange to-[oklch(0.62_0.20_45)] py-4 text-base font-black uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-4px_oklch(0.72_0.19_50/0.85)] ring-2 ring-orange/70 transition-all hover:from-[oklch(0.75_0.20_50)] hover:to-orange active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Wird versendet…
                </>
              ) : (
                <>
                  <Send className="mr-2 size-5" />
                  Rechnung senden
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
