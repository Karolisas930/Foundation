/**
 * FinanzMatrix — Financial & Tax Tools for Tradespeople
 * Sub-components live under ./finanz-matrix/.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Truck,
  Receipt,
  ShieldCheck,
  Lock,
  Camera,
  ChevronDown,
  Sparkles,
  Upload,
  Mic,
  Mail,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendPrivateInvoice } from "@/features/contractor/profile/private-invoice.functions";
import {
  PrivateInvoiceDrawer,
  type PrivateInvoicePrefill,
  type PrivateInvoiceRecord,
} from "./PrivateInvoiceDrawer";
import { ResendInvoiceDialog } from "./ResendInvoiceDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  BASE_RECEIPTS_TOTAL,
  BASE_RECEIPT_COUNT,
  RESERVE_RATIO,
  fmtEUR,
} from "./finanz-matrix/constants";
import { ScanReceiptDrawer } from "./finanz-matrix/ScanReceiptDrawer";

export default function FinanzMatrix() {
  const [datevLive, setDatevLive] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState<PrivateInvoicePrefill | undefined>(
    undefined,
  );
  const [extraReserve, setExtraReserve] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("scan") === "1") {
      setScannerOpen(true);
      params.delete("scan");
      const next = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${next ? `?${next}` : ""}`);
    }
  }, []);

  const [receiptsTotal, setReceiptsTotal] = useState(BASE_RECEIPTS_TOTAL);
  const [receiptCount, setReceiptCount] = useState(BASE_RECEIPT_COUNT);

  type InvoicePayload = {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    laborAmount: number;
    materialAmount: number;
    contractorName: string;
  };
  type Entry = {
    id: string;
    vendor: string;
    amount: number;
    category: string;
    ts: number;
    invoice?: InvoicePayload;
  };
  const [entries, setEntries] = useState<Entry[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendTarget, setResendTarget] = useState<Entry | null>(null);
  const resendInvoice = useServerFn(sendPrivateInvoice);

  const openResendDialog = (entry: Entry) => {
    if (!entry.invoice) return;
    setResendTarget(entry);
  };

  const quickSendResend = async () => {
    const entry = resendTarget;
    if (!entry?.invoice) return;
    setResendingId(entry.id);
    const toastId = toast.loading("Rechnung wird erneut versendet…");
    try {
      const result = await resendInvoice({
        data: {
          clientEmail: entry.invoice.clientEmail,
          clientName: entry.invoice.clientName,
          laborAmount: entry.invoice.laborAmount,
          materialAmount: entry.invoice.materialAmount,
          contractorName: entry.invoice.contractorName,
          invoiceNumber: entry.invoice.invoiceNumber,
          isResend: true,
        },
      });
      toast.dismiss(toastId);
      toast.success("Rechnung erneut versendet", {
        description:
          result.provider === "resend"
            ? `An ${entry.invoice.clientEmail} · Rechnung #${result.invoiceNumber}`
            : `Vorschau erstellt · E-Mail-Relay noch nicht konfiguriert`,
      });
      setResendTarget(null);
    } catch (err) {
      console.error("[private-invoice] resend failed", err);
      toast.dismiss(toastId);
      toast.error("Rechnung konnte nicht versendet werden", {
        description:
          err instanceof Error
            ? err.message
            : "Bitte prüfen Sie die E-Mail-Konfiguration und versuchen Sie es erneut.",
      });
    } finally {
      setResendingId(null);
    }
  };

  const finanzamtReserve = useMemo(
    () => Math.round(receiptsTotal * RESERVE_RATIO + extraReserve),
    [receiptsTotal, extraReserve],
  );

  const [flashKey, setFlashKey] = useState(0);

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type}... (ready for your Steuerberater)`);
  };

  const handleLogExpense = (entry: {
    vendor: string;
    amount: number;
    vat: number;
    vatRate: number;
    date: string;
    category: string;
  }) => {
    setReceiptsTotal((t) => t + entry.amount);
    setReceiptCount((c) => c + 1);
    setEntries((list) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          vendor: entry.vendor,
          amount: entry.amount,
          category: entry.category,
          ts: Date.now(),
        },
        ...list,
      ].slice(0, 25),
    );
    setFlashKey((k) => k + 1);
    setScannerOpen(false);
    toast.success("Receipt saved successfully", {
      description: `${entry.vendor} · ${fmtEUR(entry.amount)} · ${entry.category} · ${entry.vatRate}% MwSt (${fmtEUR(entry.vat)}) · ${entry.date}`,
    });
  };

  const handleUploadPick = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadProcessing(true);
    const t = toast.loading(`Parsing ${file.name}…`);
    window.setTimeout(() => {
      toast.dismiss(t);
      const amt = Number((60 + Math.random() * 340).toFixed(2));
      const netto = amt / 1.19;
      handleLogExpense({
        vendor: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Uploaded document",
        amount: amt,
        vat: Number((amt - netto).toFixed(2)),
        vatRate: 19,
        date: new Date().toLocaleDateString("de-DE"),
        category: "📄 Uploaded document",
      });
      setUploadProcessing(false);
    }, 1400);
  };

  const tryParseInvoiceCommand = (text: string): PrivateInvoicePrefill | null => {
    if (!/rechnung\s+an\s+/i.test(text)) return null;
    const nameMatch = text.match(
      /rechnung\s+an\s+([A-Za-zÄÖÜäöüß.\- ]+?)(?=[,\.]|\s+\d|\s+über|$)/i,
    );
    const clientName = nameMatch?.[1]?.trim().split(/\s+/).slice(0, 3).join(" ");
    const laborMatch = text.match(
      /(\d+[.,]?\d*)\s*(?:euro|eur|€)?\s*(?:für\s+)?(?:arbeit|arbeitslohn|lohn|labor)/i,
    );
    const materialMatch = text.match(
      /(\d+[.,]?\d*)\s*(?:euro|eur|€)?\s*(?:für\s+)?(?:material|materialien|materialkosten)/i,
    );
    const laborAmount = laborMatch ? Number(laborMatch[1].replace(",", ".")) : undefined;
    const materialAmount = materialMatch ? Number(materialMatch[1].replace(",", ".")) : undefined;
    if (!clientName && laborAmount == null && materialAmount == null) return null;
    return { clientName, laborAmount, materialAmount };
  };

  const parseAndLogSpoken = (text: string) => {
    const invoice = tryParseInvoiceCommand(text);
    if (invoice) {
      setInvoicePrefill(invoice);
      setInvoiceOpen(true);
      toast.success("Rechnungsdaten erkannt", {
        description: [
          invoice.clientName && `Kunde: ${invoice.clientName}`,
          invoice.laborAmount != null && `Arbeit: ${fmtEUR(invoice.laborAmount)}`,
          invoice.materialAmount != null && `Material: ${fmtEUR(invoice.materialAmount)}`,
        ]
          .filter(Boolean)
          .join(" · "),
      });
      return;
    }

    const amtMatch = text.match(/(\d+[.,]?\d*)/);
    const amount = amtMatch ? Number(amtMatch[1].replace(",", ".")) : 0;
    if (!amount) {
      toast.error(`Couldn't detect amount in: "${text}"`);
      return;
    }
    const vendor =
      text
        .replace(amtMatch![0], "")
        .replace(/euro|eur|€/gi, "")
        .trim() || "Voice entry";
    const netto = amount / 1.19;
    handleLogExpense({
      vendor: vendor.slice(0, 50),
      amount,
      vat: Number((amount - netto).toFixed(2)),
      vatRate: 19,
      date: new Date().toLocaleDateString("de-DE"),
      category: "🎙️ Voice-logged expense",
    });
  };

  const handleVoiceLog = () => {
    if (voiceListening) return;
    try {
      const w = window as unknown as {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
      };
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!Ctor) {
        const spoken = window.prompt(
          "Voice unavailable. Type expense (e.g. '85 euro Obi materials'):",
        );
        if (spoken) parseAndLogSpoken(spoken);
        return;
      }
      const recog = new Ctor();
      recog.lang = "de-DE";
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      setVoiceListening(true);
      const t = toast.loading("Listening… say amount and vendor.");
      recog.onresult = (evt: any) => {
        const text = evt.results?.[0]?.[0]?.transcript ?? "";
        toast.dismiss(t);
        if (text) parseAndLogSpoken(text);
      };
      recog.onerror = () => {
        toast.dismiss(t);
        toast.error("Voice input failed. Check mic permissions.");
        setVoiceListening(false);
      };
      recog.onend = () => setVoiceListening(false);
      recog.start();
    } catch {
      toast.error("Voice input not available.");
      setVoiceListening(false);
    }
  };

  const handleInvoiceSent = (record: PrivateInvoiceRecord) => {
    setReceiptsTotal((t) => t + record.total);
    setReceiptCount((c) => c + 1);
    setExtraReserve((r) => r + record.reserveDelta);
    setEntries((list) =>
      [
        {
          id: `inv-${record.ts}-${Math.random().toString(36).slice(2, 6)}`,
          vendor: `📧 Rechnung → ${record.clientName}`,
          amount: record.total,
          category: "external_private",
          ts: record.ts,
          invoice: {
            invoiceNumber: record.invoiceNumber,
            clientName: record.clientName,
            clientEmail: record.clientEmail,
            laborAmount: record.laborAmount,
            materialAmount: record.materialAmount,
            contractorName: "Ihr Handwerker",
          },
        },
        ...list,
      ].slice(0, 25),
    );
    setFlashKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 pb-8">
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleUploadPick(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-white">Finanz & Tax Tools</h3>
            <p className="text-slate-400 text-sm">Keep your books clean for tax time.</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="btn-glow shrink-0">
                <Sparkles className="mr-2 size-4" />
                Quick Action
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <DropdownMenuLabel className="text-sm">Log something new</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setScannerOpen(true);
                }}
                className="cursor-pointer py-3"
              >
                <Camera className="mr-3 size-5 text-orange" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Scan Expense Receipt</span>
                  <span className="text-xs text-muted-foreground">
                    Camera + auto-extract vendor & VAT
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  uploadInputRef.current?.click();
                }}
                className="cursor-pointer py-3"
                disabled={uploadProcessing}
              >
                <Upload className="mr-3 size-5 text-orange" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Upload PDF / Image</span>
                  <span className="text-xs text-muted-foreground">
                    Import from files or gallery
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleVoiceLog();
                }}
                className="cursor-pointer py-3"
                disabled={voiceListening}
              >
                <Mic
                  className={`mr-3 size-5 text-orange ${voiceListening ? "animate-pulse" : ""}`}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {voiceListening ? "Listening…" : "Voice Log Expense"}
                  </span>
                  <span className="text-xs text-muted-foreground">Speak amount and vendor</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setInvoicePrefill(undefined);
                  setInvoiceOpen(true);
                }}
                className="cursor-pointer py-3"
              >
                <Mail className="mr-3 size-5 text-orange" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Rechnung an Privatkunden senden</span>
                  <span className="text-xs text-muted-foreground">
                    § 35a EStG · Arbeit/Material getrennt · 30% Rücklage
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="size-5 text-orange" />
            <span className="font-semibold">Mileage</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">4.820 km</p>
          <p className="text-xs text-emerald-400">€1.446 tax deductible</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-shadow duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="size-5 text-orange" />
            <span className="font-semibold">Receipts</span>
          </div>
          <p
            key={`r-${flashKey}`}
            className="text-3xl font-display font-bold text-white animate-fade-in"
          >
            {fmtEUR(receiptsTotal)}
          </p>
          <p className="text-xs text-emerald-400">{receiptCount} receipts • 19% VAT recoverable</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 transition-shadow duration-500">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-5 text-orange" />
            <span className="font-semibold">Finanzamt Reserve</span>
          </div>
          <p
            key={`f-${flashKey}`}
            className="text-3xl font-display font-bold text-white animate-fade-in"
          >
            {fmtEUR(finanzamtReserve)}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-300 ring-1 ring-inset ring-red-500/25">
              ⚠️ Recommended tax safety buffer for Q2
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h4 className="font-semibold text-white mb-4">Export for Accountant</h4>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="size-4 shrink-0 text-emerald-400" />
            <p className="text-xs sm:text-sm text-slate-200 leading-snug">
              <span className="font-semibold text-emerald-300">Linked to DATEV Enterprise.</span>{" "}
              <span className="text-slate-300">
                Your accountant has real-time access to these logs.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-emerald-300/80">Live</span>
            <Switch checked={datevLive} onCheckedChange={setDatevLive} />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleExport("Mileage Report")}
            className="w-full justify-start"
            variant="outline"
          >
            <FileText className="mr-3 size-5" /> Export Fahrtenbuch (CSV)
          </Button>
          <Button
            onClick={() => handleExport("Receipts Package")}
            className="w-full justify-start"
            variant="outline"
          >
            <Receipt className="mr-3 size-5" /> Download All Receipts (ZIP)
          </Button>
          <Button
            onClick={() => handleExport("Full Tax Package")}
            className="w-full justify-start btn-glow"
          >
            <Download className="mr-3 size-5" /> Full Accountant Export (DATEV ready)
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Connect your bank or email for automatic imports (coming soon)
      </div>

      <ScanReceiptDrawer
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onLog={handleLogExpense}
        entries={entries}
        reserveRatio={RESERVE_RATIO}
        onResendInvoice={openResendDialog}
        resendingId={resendingId}
      />

      <ResendInvoiceDialog
        open={!!resendTarget}
        onOpenChange={(v) => {
          if (!v && !resendingId) setResendTarget(null);
        }}
        target={
          resendTarget?.invoice
            ? {
                invoiceNumber: resendTarget.invoice.invoiceNumber,
                clientName: resendTarget.invoice.clientName,
                clientEmail: resendTarget.invoice.clientEmail,
                total: resendTarget.amount,
              }
            : null
        }
        sending={resendingId === resendTarget?.id}
        onQuickSend={quickSendResend}
      />

      <PrivateInvoiceDrawer
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        contractorName="Ihr Handwerker"
        prefill={invoicePrefill}
        onInvoiced={handleInvoiceSent}
      />
    </div>
  );
}
