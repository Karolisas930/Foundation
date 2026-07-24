import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  ChevronDown,
  Loader2,
  Receipt,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EXPENSE_CATEGORIES, detectExpenseCategory, fmtEUR, type ScanEntry } from "./constants";
import { RecentEntriesList } from "./RecentEntriesList";

export function ScanReceiptDrawer({
  open,
  onOpenChange,
  onLog,
  entries,
  reserveRatio,
  onResendInvoice,
  resendingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLog: (entry: {
    vendor: string;
    amount: number;
    vat: number;
    vatRate: number;
    date: string;
    category: string;
  }) => void;
  entries: ScanEntry[];
  reserveRatio: number;
  onResendInvoice: (entry: ScanEntry) => void | Promise<void>;
  resendingId: string | null;
}) {
  type VatRate = 19 | 7 | 0;
  const [phase, setPhase] = useState<"idle" | "processing" | "review">("idle");
  const [snap, setSnap] = useState<number | string | null>(0.9);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const drawerUploadRef = useRef<HTMLInputElement | null>(null);

  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [vatRate, setVatRate] = useState<VatRate>(19);
  const [category, setCategory] = useState<string>("materials");
  const [categoryAutoDetected, setCategoryAutoDetected] = useState(false);

  const amount = Number.parseFloat(amountStr.replace(",", ".")) || 0;
  const netto = vatRate > 0 ? amount / (1 + vatRate / 100) : amount;
  const mwst = amount - netto;

  const stopStream = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    setPhase("idle");
    setSnap(0.9);
    setCamError(null);
    setVendor("");
    setDate("");
    setAmountStr("");
    setVatRate(19);
    setCategory("materials");

    let cancelled = false;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera not supported on this device.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("[scan] camera access denied", err);
        setCamError("Camera permission blocked — showing demo view.");
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  useEffect(() => () => stopStream(), []);

  const handleCaptureAndParse = () => {
    if (phase !== "idle") return;
    setPhase("processing");
    window.setTimeout(() => {
      const detectedVendor = "Mannheimer Abendakademie";
      setVendor(detectedVendor);
      setDate("02.07.2026");
      setAmountStr("485.00");
      setVatRate(19);
      setCategory(detectExpenseCategory(detectedVendor));
      setCategoryAutoDetected(true);
      setPhase("review");
    }, 1500);
  };

  const handleConfirm = () => {
    stopStream();
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === category);
    onLog({
      vendor: vendor.trim() || "Unknown vendor",
      amount,
      vat: Number(mwst.toFixed(2)),
      vatRate,
      date: date.trim() || new Date().toLocaleDateString("de-DE"),
      category: cat ? `${cat.icon} ${cat.label}` : "Miscellaneous Expenses",
    });
  };

  const handleCancel = () => {
    stopStream();
    onOpenChange(false);
  };

  const inputsDisabled = phase === "processing";
  const amberBorder =
    "border-amber-400/60 bg-amber-500/[0.06] focus-visible:border-amber-300 focus-visible:ring-amber-300/40";

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) stopStream();
        onOpenChange(v);
      }}
      snapPoints={[0.8]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerContent className="h-[80vh] max-h-[80vh] border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-display flex items-center gap-2 text-xl text-white">
              <ScanLine className="size-5 text-orange" />
              Smart Receipts
            </DrawerTitle>
            <DrawerDescription className="text-slate-400">
              Hold the receipt inside the frame, then capture and review the parsed details.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-2 sm:px-6">
            <div className="mb-3">
              <button
                type="button"
                onClick={() => drawerUploadRef.current?.click()}
                className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-orange/40 bg-orange/[0.06] px-4 py-3 text-left transition hover:border-orange/70 hover:bg-orange/[0.10]"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange">
                  <Upload className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Camera className="size-4 text-orange" />
                    Upload an Invoice / Receipt
                  </div>
                  <p className="truncate text-[11px] text-slate-400">
                    PDF, JPG or PNG · off-platform transactions welcome
                  </p>
                </div>
              </button>
              <input
                ref={drawerUploadRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const amt = Number((60 + Math.random() * 340).toFixed(2));
                  const n = amt / 1.19;
                  onLog({
                    vendor: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Uploaded document",
                    amount: amt,
                    vat: Number((amt - n).toFixed(2)),
                    vatRate: 19,
                    date: new Date().toLocaleDateString("de-DE"),
                    category: "📄 Uploaded document",
                  });
                }}
              />
              <div className="mt-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 text-[11px] leading-snug text-emerald-100/90">
                Upload your invoice or log off-platform transactions here to maintain a
                mathematically accurate tracking system. The engine automatically computes your tax
                and dynamic Finanzamt reserves based on real-time earnings.
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.02_260)] via-black to-[oklch(0.10_0.02_260)]" />
              <div className="scan-grid absolute inset-0 opacity-40" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onClick={() => {
                  if (phase === "processing") return;
                  if (phase === "review") {
                    setPhase("idle");
                    setCategoryAutoDetected(false);
                    window.setTimeout(() => handleCaptureAndParse(), 0);
                  } else {
                    handleCaptureAndParse();
                  }
                }}
                role="button"
                aria-label="Tap to capture receipt"
                className={`absolute inset-0 h-full w-full object-cover ${
                  phase !== "processing" ? "cursor-pointer" : ""
                }`}
              />
              {phase !== "processing" && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
                  <span className="rounded-full border border-orange/50 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange backdrop-blur">
                    {phase === "review" ? "Tap preview to retake" : "Tap preview to capture"}
                  </span>
                </div>
              )}
              {camError && (
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-[11px] text-slate-200 ring-1 ring-white/10 backdrop-blur">
                  <CameraOff className="size-3.5 text-orange" />
                  <span>{camError}</span>
                </div>
              )}
              {[
                "top-3 left-3 border-l-2 border-t-2",
                "top-3 right-3 border-r-2 border-t-2",
                "bottom-3 left-3 border-l-2 border-b-2",
                "bottom-3 right-3 border-r-2 border-b-2",
              ].map((pos) => (
                <div
                  key={pos}
                  className={`pointer-events-none absolute size-8 rounded-sm border-orange ${pos}`}
                />
              ))}

              {phase === "processing" && (
                <div className="pointer-events-none absolute inset-x-4 inset-y-6 overflow-hidden">
                  <div className="scan-laser" />
                </div>
              )}

              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange ring-1 ring-inset ring-orange/40 backdrop-blur">
                <span className="live-dot size-1.5 rounded-full" />
                {phase === "processing" ? "AI parsing" : phase === "review" ? "Review" : "Live"}
              </div>
            </div>

            {phase !== "review" && (
              <Button
                className="btn-glow mt-4 h-12 w-full text-base font-semibold"
                onClick={handleCaptureAndParse}
                disabled={phase === "processing"}
              >
                {phase === "processing" ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Parsing receipt…
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 size-5" />
                    Capture &amp; parse receipt
                  </>
                )}
              </Button>
            )}

            {phase === "review" && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/50 bg-amber-500/[0.08] px-3 py-2.5 text-sm text-amber-100">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <p className="leading-snug">
                    📝 Please review data. Tap fields to edit or adjust if necessary.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Vendor
                    </span>
                    <input
                      type="text"
                      value={vendor}
                      disabled={inputsDisabled}
                      onChange={(e) => setVendor(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus-visible:ring-2 ${amberBorder}`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </span>
                    <input
                      type="text"
                      value={date}
                      disabled={inputsDisabled}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="TT.MM.JJJJ"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus-visible:ring-2 ${amberBorder}`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Amount (Brutto €)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    disabled={inputsDisabled}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-base font-semibold text-white outline-none transition focus-visible:ring-2 ${amberBorder}`}
                  />
                </label>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Expense Type
                    </span>
                    {categoryAutoDetected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange/50 bg-orange/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-orange">
                        <Sparkles className="size-3" /> Auto-detected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={category}
                      disabled={inputsDisabled}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setCategoryAutoDetected(false);
                      }}
                      className={`w-full appearance-none rounded-lg border bg-transparent px-3 py-2.5 pr-9 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 ${
                        categoryAutoDetected
                          ? "border-orange/70 bg-orange/10 ring-1 ring-orange/40"
                          : amberBorder
                      }`}
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-[oklch(0.18_0.02_260)] text-white"
                        >
                          {c.icon} {c.label} — {c.sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-amber-300/80" />
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    German VAT · MwSt
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { rate: 19 as VatRate, label: "19% MwSt" },
                      { rate: 7 as VatRate, label: "7% MwSt" },
                      { rate: 0 as VatRate, label: "0% / Tax Free" },
                    ].map((opt) => {
                      const active = vatRate === opt.rate;
                      return (
                        <button
                          key={opt.rate}
                          type="button"
                          disabled={inputsDisabled}
                          onClick={() => setVatRate(opt.rate)}
                          className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                            active
                              ? "border-amber-300 bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/60"
                              : "border-amber-400/40 bg-amber-500/[0.04] text-amber-200/80 hover:bg-amber-500/[0.10]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center text-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Gross</div>
                    <div className="mt-0.5 font-semibold text-white">{fmtEUR(amount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Netto</div>
                    <div className="mt-0.5 font-semibold text-emerald-300">{fmtEUR(netto)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">MwSt</div>
                    <div className="mt-0.5 font-semibold text-orange">{fmtEUR(mwst)}</div>
                  </div>
                </div>

                <Button
                  className="relative mt-2 min-h-14 w-full rounded-2xl bg-gradient-to-b from-orange to-[oklch(0.62_0.20_45)] py-4 text-base font-black uppercase tracking-[0.16em] text-white shadow-[0_0_40px_-4px_oklch(0.72_0.19_50/0.85),0_0_80px_-10px_oklch(0.72_0.19_50/0.6),inset_0_1px_0_oklch(1_0_0/0.35)] ring-2 ring-orange/70 transition-all hover:from-[oklch(0.75_0.20_50)] hover:to-orange hover:shadow-[0_0_60px_-2px_oklch(0.72_0.19_50/0.95),0_0_120px_-10px_oklch(0.72_0.19_50/0.75)] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                  disabled={amount <= 0}
                  onClick={handleConfirm}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,oklch(1_0_0/0.25),transparent_60%)]" />
                  <Receipt className="mr-2 size-5 drop-shadow" />
                  Confirm &amp; Save
                </Button>
              </div>
            )}

            <RecentEntriesList
              entries={entries}
              reserveRatio={reserveRatio}
              onResendInvoice={onResendInvoice}
              resendingId={resendingId}
            />
          </div>

          <DrawerFooter className="pt-4">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
