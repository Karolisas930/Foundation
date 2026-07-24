/**
 * ToolbeltPanel — Practical daily tools for tradespeople
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Receipt,
  Truck,
  FileText,
  Camera,
  FolderOpen,
  Download,
  Archive,
  ShieldCheck,
  Mic,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  KmTrackerSheet,
  VoiceToInvoiceSheet,
  useRecentReceipts,
  useRecentTrips,
  useAllTrips,
  requestTripCorrection,
  type TripEntry,
} from "./toolbelt/ToolbeltModals";

import { InvoiceHistorySheet } from "./toolbelt/InvoiceHistorySheet";
import { useRecentInvoices } from "./toolbelt/invoice-store";
import { JobRadar } from "./toolbelt/JobRadar";

type ToolKey = "km" | "voice" | null;

function triggerDownload(filename: string, body: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvEscape(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

function exportTripsAsCsv(trips: TripEntry[]) {
  const header = [
    "Date",
    "Purpose",
    "From",
    "To",
    "One-way km",
    "Billable km",
    "Rate (EUR/km)",
    "Deduction (EUR)",
    "Correction requested",
  ];
  const rows = trips.map((t) => [
    t.date,
    t.purpose === "client" ? "Client Site (round-trip)" : "Daily Commute (one-way)",
    t.from,
    t.to,
    String(t.oneWayKm),
    String(t.effectiveKm),
    t.purpose === "client" ? "0.30" : "0.30 / 0.38",
    t.deduction.toFixed(2),
    t.correctionRequested ? "yes" : "no",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  triggerDownload("mileage-ledger.csv", csv, "text/csv;charset=utf-8");
  toast.success("CSV mileage ledger prepared.");
}

function exportTripsAsDatev(trips: TripEntry[]) {
  // DATEV Beleg-Import (simplified): Belegdatum;Belegfeld1;Konto;Gegenkonto;Buchungstext;Betrag
  const header = ["Belegdatum", "Belegfeld1", "Konto", "Gegenkonto", "Buchungstext", "Betrag"];
  const rows = trips.map((t, i) => [
    t.date.replace(/-/g, ""),
    `KM-${String(i + 1).padStart(4, "0")}`,
    "4530", // KFZ-Kosten
    "1200", // Bank
    `${t.purpose === "client" ? "Kundenfahrt" : "Pendelfahrt"} ${t.from} -> ${t.to} (${t.effectiveKm} km)`,
    t.deduction.toFixed(2).replace(".", ","),
  ]);
  const body = [header, ...rows].map((r) => r.map(csvEscape).join(";")).join("\r\n");
  triggerDownload("mileage-datev.csv", body, "text/csv;charset=utf-8");
  toast.success("DATEV log file prepared.");
}

export function ToolbeltPanel() {
  const [open, setOpen] = useState<ToolKey>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [tripLedgerOpen, setTripLedgerOpen] = useState(false);
  const [invoiceHistoryOpen, setInvoiceHistoryOpen] = useState(false);
  const close = () => setOpen(null);
  const navigate = useNavigate();
  const recentInvoices = useRecentInvoices(3);

  const loggedReceipts = useRecentReceipts(1000);
  const recentTrips = useRecentTrips(3);
  const allTrips = useAllTrips();

  // Static demo entries (matching the compact list) merged with any newly
  // logged receipts so the full ledger sheet has real content on first open.
  const seedReceipts = [
    {
      id: "s1",
      icon: "🛠️",
      vendor: "Höffner Möbel",
      amount: "485,00 €",
      date: "02.07.2026",
      category: "Materials",
    },
    {
      id: "s2",
      icon: "⛽",
      vendor: "Aral Stuttgart",
      amount: "78,50 €",
      date: "01.07.2026",
      category: "Fuel",
    },
    {
      id: "s3",
      icon: "📦",
      vendor: "Bauhaus Stuttgart",
      amount: "142,20 €",
      date: "28.06.2026",
      category: "Materials",
    },
  ];
  const fullLedger = [
    ...loggedReceipts.map((r) => ({
      id: r.id,
      icon: "🧾",
      vendor: r.vendor,
      amount: `${Number(r.amount || 0)
        .toFixed(2)
        .replace(".", ",")} €`,
      date: r.date,
      category: r.category,
    })),
    ...seedReceipts,
  ];

  function goScanNewReceipt() {
    void navigate({ to: "/finanz", search: { scan: "1" } });
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="font-display text-lg font-bold text-white mb-1">My Toolbelt</h3>
        <p className="text-slate-400 text-sm">Quick access to the tools you use every day.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Smart Receipts — entire card is tappable → Scan New Receipt */}
        <button
          type="button"
          onClick={goScanNewReceipt}
          aria-label="Smart Receipts — scan a new receipt"
          className="sm:col-span-2 w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-transform duration-100 ease-out hover:bg-white/[0.06] active:scale-[0.98] active:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 touch-manipulation select-none"
        >
          <div className="flex items-start gap-3">
            <Receipt className="size-7 text-orange" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-semibold text-white leading-tight">Smart Receipts</p>
              <p className="text-xs text-slate-400">Snap &amp; auto-categorize</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              📁 Recent Receipts Folder
            </p>
            <ul className="divide-y divide-white/5">
              {seedReceipts.slice(0, 3).map((r) => (
                <li key={r.vendor} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm leading-none">{r.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight text-white/85">
                    {r.vendor}
                  </span>
                  <span className="font-display text-[13px] font-bold text-orange">{r.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setLedgerOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setLedgerOpen(true);
              }
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-white/60 underline-offset-4 transition hover:text-orange hover:underline cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            See All Scanned Receipts
          </span>

          <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-4 py-2.5 text-[13px] font-semibold text-orange">
            <Camera className="h-4 w-4" strokeWidth={1.5} />
            Scan New Receipt
          </span>
        </button>

        {/* KM Tracker — entire card is tappable → Log a New Trip */}
        <button
          type="button"
          onClick={() => setOpen("km")}
          aria-label="KM Tracker — log a new trip"
          className="sm:col-span-2 w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-transform duration-100 ease-out hover:bg-white/[0.06] active:scale-[0.98] active:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 touch-manipulation select-none"
        >
          <div className="flex items-start gap-3">
            <Truck className="size-7 text-orange" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-semibold text-white leading-tight">KM Tracker</p>
              <p className="text-xs text-slate-400">Business mileage log</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              📁 Recent Trips Folder
            </p>
            <ul className="divide-y divide-white/5">
              {recentTrips.length === 0 && (
                <li className="px-4 py-3 text-[12px] text-white/50">
                  No trips logged yet — open the KM Tracker to log one.
                </li>
              )}
              {recentTrips.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm leading-none">
                    {t.purpose === "client" ? "🛠️" : "🏢"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight text-white/85">
                    {t.to}
                  </span>
                  <span className="font-mono text-[11px] text-white/50">{t.effectiveKm} km</span>
                  <span className="font-display text-[13px] font-bold text-orange">
                    {t.deduction.toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setTripLedgerOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setTripLedgerOpen(true);
              }
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-white/60 underline-offset-4 transition hover:text-orange hover:underline cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            📂 See All Logged Trips
          </span>

          <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-4 py-2.5 text-[13px] font-semibold text-orange">
            <Truck className="h-4 w-4" strokeWidth={1.5} />
            Log a New Trip
          </span>
        </button>

        {/* Voice to Invoice — entire card is tappable → Dictate a New Invoice */}
        <button
          type="button"
          onClick={() => setOpen("voice")}
          aria-label="Voice to Invoice — dictate a new invoice"
          className="sm:col-span-2 w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-transform duration-100 ease-out hover:bg-white/[0.06] active:scale-[0.98] active:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 touch-manipulation select-none"
        >
          <div className="flex items-start gap-3">
            <FileText className="size-7 text-orange" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-semibold text-white leading-tight">Voice to Invoice</p>
              <p className="text-xs text-slate-400">Speak → professional bill</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              📁 Recent Invoices Folder
            </p>
            <ul className="divide-y divide-white/5">
              {recentInvoices.length === 0 && (
                <li className="px-4 py-3 text-[12px] text-white/50">
                  No invoices yet — dictate one to get started.
                </li>
              )}
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm leading-none">🧾</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight text-white/85">
                    {inv.client}
                  </span>
                  <span className="font-mono text-[11px] uppercase text-white/50">
                    {inv.status}
                  </span>
                  <span className="font-display text-[13px] font-bold text-orange">
                    {inv.amount.toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setInvoiceHistoryOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setInvoiceHistoryOpen(true);
              }
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-white/60 underline-offset-4 transition hover:text-orange hover:underline cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            See All Invoices &amp; Template
          </span>

          <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-4 py-2.5 text-[13px] font-semibold text-orange">
            <Mic className="h-4 w-4" strokeWidth={1.5} />
            Dictate a New Invoice
          </span>
        </button>
      </div>

      <KmTrackerSheet open={open === "km"} onOpenChange={(o) => !o && close()} />
      <VoiceToInvoiceSheet open={open === "voice"} onOpenChange={(o) => !o && close()} />
      <InvoiceHistorySheet open={invoiceHistoryOpen} onOpenChange={setInvoiceHistoryOpen} />

      {/* Full historical ledger sheet */}
      <Sheet open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-y-auto bg-[#0f172a] border-white/10 p-0"
        >
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="flex items-center gap-2 text-white">
              <FolderOpen className="size-5 text-orange" strokeWidth={1.5} />
              Scanned Receipts Ledger
            </SheetTitle>
            <SheetDescription>
              Complete history of every scanned receipt in this account.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-wrap gap-2 px-6 pt-4">
            <button
              type="button"
              onClick={() => toast.success("CSV ledger prepared for your Steuerberater")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
            >
              <Download className="h-4 w-4" strokeWidth={1.25} />
              Export CSV Ledger
            </button>
            <button
              type="button"
              onClick={() => toast.success("ZIP archive prepared (DATEV-optimized)")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
            >
              <Archive className="h-4 w-4" strokeWidth={1.25} />
              Download ZIP Receipts Archive
            </button>
          </div>

          <ul className="mt-4 divide-y divide-white/5 px-2 pb-8">
            {fullLedger.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base leading-none">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">{r.vendor}</p>
                  <p className="truncate text-[11px] text-white/45">
                    {r.date} · {r.category}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-orange">{r.amount}</span>
              </li>
            ))}
            {fullLedger.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-white/50">
                No receipts scanned yet.
              </li>
            )}
          </ul>
        </SheetContent>
      </Sheet>

      {/* Full historical trip ledger sheet — GoBD-locked, exportable */}
      <Sheet open={tripLedgerOpen} onOpenChange={setTripLedgerOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-y-auto bg-[#0f172a] border-white/10 p-0"
        >
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="flex items-center gap-2 text-white">
              <FolderOpen className="size-5 text-orange" strokeWidth={1.5} />
              Logged Trips Ledger
            </SheetTitle>
            <SheetDescription>
              Immutable historical trip ledger — every entry is GoBD-locked once saved.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-wrap gap-2 px-6 pt-4">
            <button
              type="button"
              onClick={() => exportTripsAsCsv(allTrips)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
            >
              <Download className="h-4 w-4" strokeWidth={1.25} />
              📥 Export CSV Mileage Ledger
            </button>
            <button
              type="button"
              onClick={() => exportTripsAsDatev(allTrips)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
            >
              <Archive className="h-4 w-4" strokeWidth={1.25} />
              📦 Export DATEV Log File
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 px-6 text-[10px] uppercase tracking-widest text-emerald-300/80">
            <ShieldCheck className="h-3 w-3" strokeWidth={1.5} /> GoBD immutability guard active
          </div>

          <ul className="mt-4 divide-y divide-white/5 px-2 pb-8">
            {allTrips.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">
                    {t.purpose === "client" ? "🛠️" : "🏢"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90">
                      {t.from} → {t.to}
                    </p>
                    <p className="truncate text-[11px] text-white/45">
                      {t.date} ·{" "}
                      {t.purpose === "client" ? "Client Site (round-trip)" : "Commute (one-way)"} ·{" "}
                      {t.effectiveKm} km
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-orange">
                    {t.deduction.toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    requestTripCorrection(t.id);
                    toast.success("Compliance correction request logged for review.");
                  }}
                  disabled={t.correctionRequested}
                  className="mt-1 pl-7 text-[10px] font-medium text-orange/80 underline-offset-2 hover:underline disabled:text-emerald-300/80 disabled:no-underline"
                >
                  {t.correctionRequested
                    ? "✓ Correction requested — pending audit review"
                    : "Request Compliance Correction"}
                </button>
              </li>
            ))}
            {allTrips.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-white/50">No trips logged yet.</li>
            )}
          </ul>
        </SheetContent>
      </Sheet>

      {/* Job Radar — personalized by trades + area, with Free/Premium modes */}
      <JobRadar />

      {/* Smart Material Procurement Hub */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-orange">🛒</span> Smart Material Hub
        </h4>
        <p className="text-sm text-slate-400 mb-5">Detected from your recent quotations</p>

        <div className="space-y-4">
          <div className="bg-white/[0.05] p-4 rounded-xl">
            <p className="font-semibold text-white">Mini Excavator (7 days)</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-400">OBI</span>
                <span>
                  €220/day <span className="text-xs text-emerald-400">(Cheapest)</span>
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bauhaus</span>
                <span>€245/day</span>
              </div>
            </div>
            <Button className="mt-3 w-full text-xs" variant="outline">
              Request Quote from OBI
            </Button>
          </div>

          <div className="bg-white/[0.05] p-4 rounded-xl">
            <p className="font-semibold text-white">Skip Hire 7m³</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-400">Bauhaus</span>
                <span>
                  €145 <span className="text-xs text-emerald-400">(Cheapest)</span>
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hornbach</span>
                <span>€160</span>
              </div>
            </div>
            <Button className="mt-3 w-full text-xs" variant="outline">
              Request Quote from Bauhaus
            </Button>
          </div>
        </div>

        <Button className="w-full mt-6 btn-glow">Add New Material from Quotation</Button>
      </div>

      <div className="text-center text-xs text-slate-500 pt-4">More tools coming soon</div>
    </div>
  );
}
