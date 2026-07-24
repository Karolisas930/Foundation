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
import { useLedgerTotal } from "./SmartReceiptsSheet";

/* ---------- 2. KM Tracker — German Tax Mileage Engine --------------- */

export type TripPurpose = "client" | "commute";
export type TripEntry = {
  id: string;
  loggedAt: number;
  date: string;
  purpose: TripPurpose;
  from: string;
  to: string;
  oneWayKm: number;
  effectiveKm: number;
  deduction: number;
  correctionRequested?: boolean;
};

const tripLedger: { entries: TripEntry[] } = { entries: [] };
const tripListeners = new Set<() => void>();
function subscribeTrips(cb: () => void) {
  tripListeners.add(cb);
  return () => {
    tripListeners.delete(cb);
  };
}
function notifyTrips() {
  tripListeners.forEach((fn) => fn());
}

export function pushTripEntry(entry: Omit<TripEntry, "id" | "loggedAt">) {
  tripLedger.entries.unshift({
    ...entry,
    id: crypto.randomUUID(),
    loggedAt: Date.now(),
  });
  notifyTrips();
}
export function requestTripCorrection(id: string) {
  const t = tripLedger.entries.find((e) => e.id === id);
  if (!t || t.correctionRequested) return;
  t.correctionRequested = true;
  notifyTrips();
}
export function useRecentTrips(limit = 3): TripEntry[] {
  const [, force] = useState(0);
  useEffect(() => subscribeTrips(() => force((n) => n + 1)), []);
  return tripLedger.entries.slice(0, limit);
}
export function useAllTrips(): TripEntry[] {
  const [, force] = useState(0);
  useEffect(() => subscribeTrips(() => force((n) => n + 1)), []);
  return tripLedger.entries;
}

/**
 * German tax mileage calculator.
 *
 *   • Client-site (round-trip)    → both ways × €0.30/km flat
 *   • Daily commute (one-way)     → first 20 km × €0.30/km
 *                                   from the 21st km × €0.38/km
 *                                   ("Entfernungspauschale", § 9 EStG)
 */
export function calcTripDeduction(purpose: TripPurpose, oneWayKm: number) {
  const km = Math.max(0, Math.round(oneWayKm));
  if (purpose === "client") {
    const effectiveKm = km * 2;
    return { effectiveKm, deduction: Math.round(effectiveKm * 30) / 100 };
  }
  const first = Math.min(km, 20);
  const rest = Math.max(0, km - 20);
  const cents = first * 30 + rest * 38;
  return { effectiveKm: km, deduction: Math.round(cents) / 100 };
}

function extractPostcode(s: string): string | null {
  const m = s.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}
function estimateOneWayKm(baseAddr: string, destAddr: string): number {
  const a = extractPostcode(baseAddr);
  const b = extractPostcode(destAddr);
  if (!a || !b) return 0;
  return Math.max(1, Math.min(180, Math.round(Math.abs(Number(a) - Number(b)) / 320)));
}

type DestOption = { label: string; value: string; km: number; icon: string };
const STUTTGART_DESTINATIONS: DestOption[] = [
  {
    icon: "📍",
    label: "Königstraße 2, 70173 Stuttgart (Zentrum)",
    value: "Königstraße 2, 70173 Stuttgart",
    km: 3,
  },
  {
    icon: "📍",
    label: "Theodor-Heuss-Straße 12, 70174 Stuttgart",
    value: "Theodor-Heuss-Straße 12, 70174 Stuttgart",
    km: 2,
  },
  {
    icon: "📍",
    label: "Schlossstraße 45, 70176 Stuttgart",
    value: "Schlossstraße 45, 70176 Stuttgart",
    km: 1,
  },
  {
    icon: "📍",
    label: "Boschstraße 8, 70469 Stuttgart (Feuerbach)",
    value: "Boschstraße 8, 70469 Stuttgart",
    km: 7,
  },
  {
    icon: "🛠️",
    label: "Active Project: Müller Bathroom — Stuttgart",
    value: "Müller Bathroom, Alexanderstraße 9, 70184 Stuttgart",
    km: 5,
  },
];

const DEFAULT_BASE_ADDRESS = "Hauptstraße 14, 70176 Stuttgart";

export function KmTrackerSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const profile = getActiveHandymanProfile();
  const registrationAddr = (() => {
    const street = profile?.streetAddress?.trim();
    const line = [profile?.postalCode, profile?.city].filter(Boolean).join(" ").trim();
    if (street && line) return `${street}, ${line}`;
    return line || DEFAULT_BASE_ADDRESS;
  })();

  const [baseAddress, setBaseAddress] = useState<string>(() => {
    if (typeof window === "undefined") return registrationAddr;
    const saved = window.localStorage.getItem("km.basePostcode");
    if (saved) return saved;
    return registrationAddr;
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("km.basePostcode", baseAddress);
  }, [baseAddress]);

  const [purpose, setPurpose] = useState<TripPurpose>("client");
  const [destAddress, setDestAddress] = useState("");
  const [destOpen, setDestOpen] = useState(false);
  const [manualOneWayKm, setManualOneWayKm] = useState<string>("");
  const [tripDate, setTripDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [datev, setDatev] = useState(true);

  const trips = useAllTrips();
  const receiptsTotal = useLedgerTotal();

  const filteredDestinations = useMemo(() => {
    const q = destAddress.trim().toLowerCase();
    if (!q) return STUTTGART_DESTINATIONS;
    const hits = STUTTGART_DESTINATIONS.filter(
      (d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q),
    );
    return hits.length ? hits : STUTTGART_DESTINATIONS;
  }, [destAddress]);

  const estimatedOneWay = useMemo(() => {
    const manual = Number(manualOneWayKm);
    if (manual > 0) return manual;
    return estimateOneWayKm(baseAddress, destAddress);
  }, [baseAddress, destAddress, manualOneWayKm]);

  const draftCalc = useMemo(
    () => calcTripDeduction(purpose, estimatedOneWay),
    [purpose, estimatedOneWay],
  );

  const totalKm = useMemo(() => trips.reduce((s, t) => s + t.effectiveKm, 0), [trips]);
  const mileageDeduction = useMemo(() => trips.reduce((s, t) => s + t.deduction, 0), [trips]);

  const grossIncome = receiptsTotal;
  const mwstOut = grossIncome * (0.19 / 1.19);
  const net = grossIncome - mwstOut - mileageDeduction;
  const netTaxReserve = Math.max(0, net * 0.275);
  const finanzReserve = netTaxReserve + Math.max(0, mwstOut);

  const fmt = (n: number) =>
    `€ ${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function logTrip() {
    if (!baseAddress.trim()) {
      toast.error("Set your base / registration address first.");
      return;
    }
    if (!destAddress.trim()) {
      toast.error("Enter a destination address or select a saved project.");
      return;
    }
    if (estimatedOneWay <= 0) {
      toast.error("Enter one-way kilometers — could not auto-estimate.");
      return;
    }
    pushTripEntry({
      date: tripDate,
      purpose,
      from: baseAddress,
      to: destAddress,
      oneWayKm: estimatedOneWay,
      effectiveKm: draftCalc.effectiveKm,
      deduction: draftCalc.deduction,
    });
    setDestAddress("");
    setManualOneWayKm("");
    toast.success(`Logged ${draftCalc.effectiveKm} km · ${fmt(draftCalc.deduction)} deductible.`);
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
            <Truck className="size-5 text-orange" strokeWidth={1.5} /> KM Tracker
          </SheetTitle>
          <SheetDescription>
            Audit-safe German Tax Mileage Engine — every trip feeds directly into your Finanzamt
            reserve.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-10 pt-4 space-y-5">
          {/* DATEV banner */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-emerald-300">DATEV Enterprise sync</p>
              <p className="text-[11px] text-emerald-300/70">
                Post approved entries directly into DATEV Unternehmen online.
              </p>
            </div>
            <Switch checked={datev} onCheckedChange={setDatev} />
          </div>

          {/* Log a trip */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
              Log a trip
            </p>

            {/* Trip Purpose Selector — required BEFORE destination */}
            <div>
              <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Trip purpose
              </Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPurpose("client")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition",
                    purpose === "client"
                      ? "border-orange/60 bg-orange/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-orange/40",
                  )}
                >
                  <span className="text-sm font-semibold">🛠️ Client Site / Round-Trip</span>
                  <span className="text-[10px] font-mono text-slate-400">€0,30/km · both ways</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPurpose("commute")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition",
                    purpose === "commute"
                      ? "border-orange/60 bg-orange/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-orange/40",
                  )}
                >
                  <span className="text-sm font-semibold">🏢 Daily Commute / One-Way</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    €0,30 → €0,38 from km 21
                  </span>
                </button>
              </div>
            </div>

            {/* Auto-Sensing Address Fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <MapPin className="size-3.5 text-orange" strokeWidth={1.5} /> Base address
                </Label>
                <Input
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                  placeholder={registrationAddr || "e.g. 68159 Mannheim"}
                  className="intake-input mt-2 h-10"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Pre-filled from your registration postcode — accepts full street address.
                </p>
              </div>
              <div className="relative">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <MapPin className="size-3.5 text-orange" strokeWidth={1.5} /> Destination
                </Label>
                <Input
                  value={destAddress}
                  onChange={(e) => {
                    setDestAddress(e.target.value);
                    setDestOpen(true);
                  }}
                  onFocus={() => setDestOpen(true)}
                  onBlur={() => setTimeout(() => setDestOpen(false), 150)}
                  placeholder="Street, postcode or saved project…"
                  className="intake-input mt-2 h-10"
                  autoComplete="off"
                />
                {destOpen && filteredDestinations.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-sm shadow-xl">
                    {filteredDestinations.map((d) => (
                      <li key={d.value}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDestAddress(d.value);
                            setManualOneWayKm(String(d.km));
                            setDestOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.06]"
                        >
                          <span className="truncate">
                            <span className="mr-2">{d.icon}</span>
                            {d.label}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            ≈ {d.km} km
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-[10px] text-slate-500">
                  Local suggestions — no external API calls.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Trip date
                </Label>
                <Input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="intake-input mt-2 h-10"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  One-way km{" "}
                  {estimatedOneWay > 0 && !manualOneWayKm && (
                    <span className="ml-2 text-[10px] font-mono text-orange-glow">
                      auto ≈ {estimatedOneWay}
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={manualOneWayKm}
                  onChange={(e) => setManualOneWayKm(e.target.value)}
                  placeholder={estimatedOneWay > 0 ? String(estimatedOneWay) : "km"}
                  className="intake-input mt-2 h-10 font-mono"
                />
              </div>
            </div>

            {/* Live draft preview — recalculates instantly with purpose + km */}
            <div className="rounded-xl border border-orange/25 bg-orange/5 px-4 py-3 text-sm text-slate-200 flex items-center justify-between">
              <span>
                {purpose === "client" ? "Round-trip" : "One-way commute"} ·{" "}
                <span className="font-mono text-white">{draftCalc.effectiveKm} km</span>
              </span>
              <span className="font-mono font-semibold text-orange">
                {fmt(draftCalc.deduction)} deductible
              </span>
            </div>

            <Button
              type="button"
              onClick={logTrip}
              className="btn-glow btn-glow-hover w-full h-11 rounded-full font-semibold"
            >
              Log trip
            </Button>
          </div>

          {/* Live totalizer metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Total mileage
              </Label>
              <p className="mt-2 font-display text-3xl font-bold text-white">
                {totalKm.toLocaleString("de-DE")}{" "}
                <span className="text-sm text-slate-400 font-normal">km</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-500">Deductible total</p>
              <p className="text-sm font-semibold text-white">{fmt(mileageDeduction)}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Receipts logged
              </Label>
              <p className="mt-2 font-display text-3xl font-bold text-white">{fmt(grossIncome)}</p>
              <p className="mt-2 text-[11px] text-slate-500">MwSt (19%) out</p>
              <p className="text-sm font-semibold text-white">{fmt(mwstOut)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-orange/30 bg-gradient-to-br from-orange/10 to-orange/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
                Finanzamt reserve
              </p>
              <span className="rounded-full bg-orange/20 px-2 py-0.5 text-[10px] font-semibold text-orange-glow">
                27.5% net + MwSt
              </span>
            </div>
            <p className="mt-2 font-display text-4xl font-bold text-white">{fmt(finanzReserve)}</p>
            <p className="mt-1 text-[11px] text-slate-300">
              Auto-recalculated from {fmt(Math.max(0, net))} net (income − MwSt − mileage) plus
              outstanding MwSt liability.
            </p>
          </div>

          {/* Immutable trip log */}
          {trips.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Recent trips · immutable ledger
                </p>
                <span className="text-[9px] uppercase tracking-widest text-emerald-300/80">
                  🔒 GoBD locked
                </span>
              </div>
              {trips.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-white">
                        <span className="mr-2 text-[10px] font-mono uppercase text-slate-400">
                          {t.purpose === "client" ? "Client" : "Commute"}
                        </span>
                        {t.to}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t.date} · {t.effectiveKm} km · {fmt(t.deduction)}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-white">
                      {t.effectiveKm} km
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      requestTripCorrection(t.id);
                      toast.success("Compliance correction request logged for review.");
                    }}
                    disabled={t.correctionRequested}
                    className="mt-1 text-[10px] font-medium text-orange/80 underline-offset-2 hover:underline disabled:text-emerald-300/80 disabled:no-underline"
                  >
                    {t.correctionRequested
                      ? "✓ Correction requested — pending audit review"
                      : "Request Compliance Correction"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
