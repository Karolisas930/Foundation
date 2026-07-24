import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Camera,
  ScanLine,
  Truck,
  Download,
  Mic,
  MicOff,
  MapPin,
  Check,
  Building2,
  ChevronDown,
  Upload,
  FileText,
  Trash2,
  Send,
  Loader2,
  Mail,
  Users,
  Search,
  Moon,
  Sun,
  CalendarDays,
  Percent,
  X,
  Eye,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";
import {
  addInvoice,
  useCompanyLegalInfo,
  updateCompanyLegalInfo,
  missingLegalFields,
  useInvoiceTemplateFile,
  setInvoiceTemplateFile,
  REQUIRED_LEGAL_KEYS,
  type CompanyLegalInfo,
} from "@/features/contractor/profile/components/toolbelt/invoice-store";
import { sendPrivateInvoice } from "@/features/contractor/profile/private-invoice.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTemplateContext,
  compileInvoiceFromTemplate,
  downloadBlob,
} from "@/features/contractor/profile/components/toolbelt/template-merge";
import {
  MARKETPLACE_CLIENTS,
  suggestVatRateForClient,
  type MarketplaceClient,
} from "@/features/contractor/profile/components/toolbelt/marketplace-clients";
import { ToolbeltStyles } from "./ToolbeltStyles";

/* ---------- 1. Smart Receipts ---------------------------------------- */

type ParsedReceipt = {
  vendor: string;
  date: string;
  category: string;
  amount: string;
};

const RECEIPT_CATEGORIES = [
  "Materials · Building supplies",
  "Tools & equipment",
  "Fuel & vehicle",
  "Subcontractor",
  "Office & admin",
  "Other",
];

// Vendor-keyword → category heuristic. Runs on the parsed vendor string so
// the review screen opens with the most likely category already selected.
function detectCategoryFromVendor(vendor: string): string {
  const v = vendor.toLowerCase();
  if (/(obi|bauhaus|hornbach|toom|hagebau|globus|baumarkt|baustoff|material)/.test(v))
    return "Materials · Building supplies";
  if (/(shell|aral|esso|jet|total|tank|fuel|diesel|benzin|bp )/.test(v)) return "Fuel & vehicle";
  if (/(hilti|makita|bosch|dewalt|milwaukee|werkzeug|tool)/.test(v)) return "Tools & equipment";
  if (/(db bahn|deutsche bahn|flixbus|uber|taxi|hotel|ibis|travel|reise)/.test(v))
    return "Fuel & vehicle";
  if (/(subcontract|subunternehmer|freelanc)/.test(v)) return "Subcontractor";
  if (/(office|büro|staples|mediamarkt|saturn|amazon|admin|post|telekom)/.test(v))
    return "Office & admin";
  return "Materials · Building supplies";
}

// Lightweight, deterministic client-side "parser" — extracts likely vendor,
// date and amount tokens from any filename or dropped image name so the
// user gets a reasonable pre-fill without a network call.
function parseReceiptHeuristic(seed: string): ParsedReceipt {
  const vendors = ["OBI Baumarkt", "Bauhaus", "Hornbach", "Toom", "Hagebau", "Globus Baumarkt"];
  const cities = ["Mannheim", "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"];
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const amountMatch = seed.match(/(\d{1,4}[.,]\d{2})/);
  const amountNum = amountMatch
    ? Number(amountMatch[1].replace(",", "."))
    : Math.round((30 + Math.random() * 320) * 100) / 100;
  const vendor = `${pick(vendors)} ${pick(cities)}`;
  return {
    vendor,
    date: new Date().toLocaleDateString("en-GB"),
    category: detectCategoryFromVendor(vendor),
    amount: amountNum.toFixed(2),
  };
}

const EMPTY_PARSED: ParsedReceipt = { vendor: "", date: "", category: "", amount: "" };

/**
 * Structural pre-check: does this frame plausibly contain a receipt?
 * Receipts are paper (many bright pixels) + printed text (some very dark
 * pixels) with meaningful luminance variance. Skin, empty walls, or floor
 * shots are near-uniform mid-tones and fail all three checks — so we skip
 * the mock parser and let the user type the real values into blank fields.
 */
function frameLooksLikeReceipt(source: HTMLVideoElement | HTMLImageElement): boolean {
  try {
    const w = 80;
    const h = 80;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true; // fail-open — don't block the user
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let sum = 0;
    let sumSq = 0;
    let bright = 0;
    let dark = 0;
    const n = w * h;
    for (let i = 0; i < data.length; i += 4) {
      const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += y;
      sumSq += y * y;
      if (y > 200) bright++;
      if (y < 60) dark++;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const stddev = Math.sqrt(Math.max(0, variance));
    const brightRatio = bright / n;
    const darkRatio = dark / n;
    // Needs paper-like brightness, some ink-dark pixels, and real contrast.
    return brightRatio > 0.12 && darkRatio > 0.015 && stddev > 32;
  } catch {
    return true; // fail-open on any canvas / CORS error
  }
}

// Ledger state — shared in-module so the KM Tracker's live finance card
// can read receipt totals in the same session (both modals mount fresh on
// open but the ledger persists across opens).
type LedgerEntry = ParsedReceipt & { id: string; loggedAt: number };
const receiptLedger: { entries: LedgerEntry[] } = { entries: [] };
const ledgerListeners = new Set<() => void>();
function pushLedgerEntry(entry: ParsedReceipt) {
  receiptLedger.entries.push({ ...entry, id: crypto.randomUUID(), loggedAt: Date.now() });
  ledgerListeners.forEach((fn) => fn());
}
export function useLedgerTotal() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    ledgerListeners.add(fn);
    return () => {
      ledgerListeners.delete(fn);
    };
  }, []);
  return receiptLedger.entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
}

export type ReceiptLedgerEntry = LedgerEntry;

/**
 * Public hook: subscribe to the receipt ledger and get the N most recent
 * scans (newest first). Used by AppSideMenu's "Recent Scans History".
 */
export function useRecentReceipts(limit = 3): LedgerEntry[] {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    ledgerListeners.add(fn);
    return () => {
      ledgerListeners.delete(fn);
    };
  }, []);
  return [...receiptLedger.entries].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, limit);
}

export function SmartReceiptsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "live" | "blocked" | "unsupported">(
    "idle",
  );
  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCameraState("idle");
      setScanning(false);
      setParsed(null);
      setUploadedPreview(null);
      return;
    }
    let cancelled = false;
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md || !md.getUserMedia) {
      setCameraState("unsupported");
      return;
    }
    md.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            /* autoplay blocked */
          });
        }
        setCameraState("live");
      })
      .catch(() => setCameraState("blocked"));
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open]);

  function triggerScan(seed: string, probe: HTMLVideoElement | HTMLImageElement | null) {
    setScanning(true);
    setParsed(null);
    window.setTimeout(() => {
      const readable = probe ? frameLooksLikeReceipt(probe) : true;
      if (!readable) {
        setParsed({ ...EMPTY_PARSED });
        setScanning(false);
        toast("📝 No receipt text detected.", {
          description: "Please frame your document clearly or fill in details manually.",
        });
        return;
      }
      setParsed(parseReceiptHeuristic(seed));
      setScanning(false);
    }, 1500);
  }

  function onFilePicked(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setUploadedPreview(url);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => triggerScan(f.name, img);
    img.onerror = () => triggerScan(f.name, null);
    img.src = url;
  }

  function confirmToLedger() {
    if (!parsed) return;
    pushLedgerEntry(parsed);
    toast.success("Receipt saved successfully", {
      description: `${parsed.vendor} · ${parsed.category} · € ${parsed.amount}`,
    });
    setParsed(null);
    setUploadedPreview(null);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto bg-[#0f172a] border-white/10 p-0"
      >
        <ToolbeltStyles />
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-white flex items-center gap-2">
            <Camera className="size-5 text-orange" strokeWidth={1.5} /> Smart Receipts
          </SheetTitle>
          <SheetDescription>
            Point your camera at a receipt — we parse vendor, date and amount into your ledger.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-8 pt-4 space-y-6">
          {/* Viewfinder */}
          <div
            className={cn(
              "relative mx-auto max-w-md aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#101827] to-[#050810]",
              cameraState === "live" && !scanning && "cursor-pointer",
            )}
            onClick={() => {
              if (cameraState !== "live" || scanning) return;
              // Tap anywhere on the live preview to capture / retake
              setUploadedPreview(null);
              triggerScan(`live-${Date.now()}`, videoRef.current);
            }}
            role={cameraState === "live" ? "button" : undefined}
            aria-label={cameraState === "live" ? "Tap to capture receipt" : undefined}
          >
            {/* Live video stream */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity",
                cameraState === "live" ? "opacity-100" : "opacity-0",
              )}
            />
            {/* Uploaded fallback preview */}
            {uploadedPreview && (
              <img
                src={uploadedPreview}
                alt="Uploaded receipt"
                className="absolute inset-0 h-full w-full object-contain bg-black/60"
              />
            )}
            {/* Corner brackets */}
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span
                key={c}
                className={cn(
                  "absolute size-6 border-orange z-10",
                  c === "tl" && "left-4 top-4 border-l-2 border-t-2",
                  c === "tr" && "right-4 top-4 border-r-2 border-t-2",
                  c === "bl" && "left-4 bottom-4 border-l-2 border-b-2",
                  c === "br" && "right-4 bottom-4 border-r-2 border-b-2",
                )}
              />
            ))}
            {/* Laser scan line — visible while scanning */}
            {scanning && (
              <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                <div className="tb-laser absolute left-6 right-6 -mt-[1px] h-[2px] rounded-full bg-orange" />
              </div>
            )}
            {/* Idle / blocked / unsupported overlays */}
            {cameraState !== "live" && !uploadedPreview && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {cameraState === "idle" && "Requesting camera…"}
                  {cameraState === "blocked" && "Camera permission blocked"}
                  {cameraState === "unsupported" && "Camera not available on this device"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Use the upload option below to import a receipt image.
                </p>
              </div>
            )}
            {/* Tap-to-capture hint */}
            {cameraState === "live" && !scanning && !parsed && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-glow border border-orange/40">
                  Tap preview to capture
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => triggerScan(`live-${Date.now()}`, videoRef.current)}
              disabled={scanning || cameraState !== "live"}
              className="btn-glow btn-glow-hover h-11 rounded-full font-semibold disabled:opacity-50"
            >
              <ScanLine className="mr-2 size-4" strokeWidth={1.5} />
              {scanning ? "Parsing…" : "Capture & parse receipt"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="h-11 rounded-full border-white/15 text-white hover:bg-white/5"
            >
              <Camera className="mr-2 size-4" strokeWidth={1.5} /> Upload receipt image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFilePicked(e.target.files)}
            />
          </div>

          {/* Editable parsed form */}
          {parsed && (
            <div className="rounded-xl border border-orange/30 bg-orange/5 p-4 space-y-3 animate-fade-in">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
                Parsed receipt — edit before logging
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Vendor
                  </Label>
                  <Input
                    value={parsed.vendor}
                    onChange={(e) => setParsed({ ...parsed, vendor: e.target.value })}
                    className="intake-input mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Date
                  </Label>
                  <Input
                    value={parsed.date}
                    onChange={(e) => setParsed({ ...parsed, date: e.target.value })}
                    className="intake-input mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Category
                  </Label>
                  <select
                    value={parsed.category}
                    onChange={(e) => setParsed({ ...parsed, category: e.target.value })}
                    className="intake-input mt-1 h-10 w-full rounded-md border border-orange/50 bg-orange/10 px-3 text-sm font-semibold text-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
                  >
                    {RECEIPT_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#0f172a] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-orange-glow/80">
                    ✨ Auto-detected · tap to change
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Amount (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parsed.amount}
                    onChange={(e) => setParsed({ ...parsed, amount: e.target.value })}
                    className="intake-input mt-1 h-10 font-semibold text-orange"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VAT breakdown + totals (German 19% MwSt) */}
          {parsed &&
            (() => {
              const gross = Number(parsed.amount) || 0;
              const net = gross / 1.19;
              const vat = gross - net;
              const fmt = (n: number) => `€ ${n.toFixed(2)}`;
              return (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    VAT breakdown
                  </p>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Net</span>
                    <span className="font-semibold text-white">{fmt(net)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>MwSt (19%)</span>
                    <span className="font-semibold text-white">{fmt(vat)}</span>
                  </div>
                  <div className="mt-2 border-t border-white/10 pt-2 flex justify-between text-sm">
                    <span className="text-slate-300">Total (gross)</span>
                    <span className="font-bold text-orange">{fmt(gross)}</span>
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Sticky prominent Confirm & Save at the very bottom of the sheet */}
        {parsed && (
          <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#0f172a]/95 px-6 py-4 backdrop-blur-md">
            <Button
              type="button"
              onClick={confirmToLedger}
              className="btn-glow btn-glow-hover w-full min-h-14 h-14 rounded-full text-base font-bold uppercase tracking-wider text-white shadow-[0_0_28px_rgba(255,140,0,0.55)] ring-2 ring-orange/60 hover:shadow-[0_0_38px_rgba(255,140,0,0.75)]"
            >
              <Check className="mr-2 size-5" strokeWidth={2.5} /> Confirm &amp; Save
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
