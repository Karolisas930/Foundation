/**
 * InvoiceHistorySheet — professional Invoice History & Stats dashboard for
 * the Voice-to-Invoice tool.
 *
 * Sections:
 *   1. Overview KPIs (Total billed / Paid / Outstanding + counts)
 *   2. Quick stats (avg payment time, top clients)
 *   3. Filters (search, status, date range)
 *   4. Invoice list with per-row Resend action + status transitions
 *   5. Collapsible template & legal-info setup panel (unchanged behaviour)
 */
import { useMemo, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  X,
  Trash2,
  Search,
  Send,
  Landmark,
  Settings2,
  Clock,
  Users,
  CircleDollarSign,
  Download,
} from "lucide-react";
import { downloadDatevCsv } from "./invoice-datev";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAllInvoices,
  useInvoiceTemplateFile,
  setInvoiceTemplateFile,
  useCompanyLegalInfo,
  updateCompanyLegalInfo,
  missingLegalFields,
  REQUIRED_LEGAL_KEYS,
  setInvoiceStatus,
  markInvoiceResent,
  deleteInvoice,
  type InvoiceStatus,
  type InvoiceEntry,
  type CompanyLegalInfo,
} from "./invoice-store";

const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/10 text-white/70 border-white/15" },
  sent: { label: "Sent", className: "bg-sky-500/15 text-sky-200 border-sky-400/30" },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  },
  overdue: {
    label: "Overdue",
    className: "bg-orange/15 text-orange border-orange/40",
  },
};

const STATUS_FILTERS: Array<{ key: "all" | InvoiceStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

const DATE_RANGES: Array<{ key: "all" | "7d" | "30d" | "90d" | "year"; label: string }> = [
  { key: "all", label: "All time" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "year", label: "This year" },
];

const OPTIONAL_LEGAL_KEYS: Array<{
  key: keyof CompanyLegalInfo;
  label: string;
  placeholder?: string;
}> = [
  { key: "address", label: "Street address", placeholder: "Hauptstraße 42" },
  { key: "taxNumber", label: "Steuernummer", placeholder: "12/345/67890" },
  { key: "iban", label: "IBAN", placeholder: "DE00 0000 0000 0000 0000 00" },
  { key: "bic", label: "BIC", placeholder: "DEUTDEDBXXX" },
  { key: "bankName", label: "Bank name", placeholder: "Sparkasse" },
];

const FIELD_META: Record<keyof CompanyLegalInfo, { label: string; placeholder?: string }> = {
  companyName: { label: "Company / Trade name", placeholder: "Mustermann Handwerk" },
  address: { label: "Street address", placeholder: "Hauptstraße 42" },
  postalCode: { label: "Postal code", placeholder: "70173" },
  city: { label: "City", placeholder: "Stuttgart" },
  state: { label: "State", placeholder: "Baden-Württemberg" },
  email: { label: "Contact email", placeholder: "kontakt@example.de" },
  phone: { label: "Contact phone", placeholder: "+49 …" },
  companyRegistration: { label: "Company Registration (HRB)", placeholder: "HRB 123456" },
  vatId: { label: "USt-IdNr", placeholder: "DE123456789" },
  managingDirector: { label: "Managing Director", placeholder: "Max Mustermann" },
  taxNumber: { label: "Steuernummer", placeholder: "12/345/67890" },
  iban: { label: "IBAN", placeholder: "DE00 …" },
  bic: { label: "BIC", placeholder: "DEUTDEDBXXX" },
  bankName: { label: "Bank name", placeholder: "Sparkasse" },
};

function formatEuro(n: number) {
  return `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function withinRange(inv: InvoiceEntry, range: (typeof DATE_RANGES)[number]["key"]) {
  if (range === "all") return true;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (range === "7d") return now - inv.createdAt <= 7 * day;
  if (range === "30d") return now - inv.createdAt <= 30 * day;
  if (range === "90d") return now - inv.createdAt <= 90 * day;
  if (range === "year") return new Date(inv.createdAt).getFullYear() === new Date().getFullYear();
  return true;
}

export function InvoiceHistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const invoices = useAllInvoices();
  const templateFile = useInvoiceTemplateFile();
  const company = useCompanyLegalInfo();
  const missing = useMemo(() => missingLegalFields(company), [company]);
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]["key"]>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Template too large — 5 MB max.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceTemplateFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: Date.now(),
      });
      toast.success("Custom invoice template uploaded.");
    };
    reader.onerror = () => toast.error("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  // ---- KPIs across the full ledger (unfiltered) ----
  const kpis = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue" || i.status === "draft")
      .reduce((s, i) => s + i.amount, 0);
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    return { total, paid, outstanding, paidCount, count: invoices.length };
  }, [invoices]);

  const avgPaymentDays = useMemo(() => {
    const paid = invoices.filter(
      (i) => i.status === "paid" && i.paidAt && (i.sentAt ?? i.createdAt),
    );
    if (paid.length === 0) return null;
    const day = 24 * 60 * 60 * 1000;
    const total = paid.reduce(
      (s, i) => s + ((i.paidAt as number) - ((i.sentAt as number) ?? i.createdAt)) / day,
      0,
    );
    return total / paid.length;
  }, [invoices]);

  const topClients = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    invoices.forEach((i) => {
      const name = (i.client || "Unnamed").trim() || "Unnamed";
      const prev = map.get(name) ?? { amount: 0, count: 0 };
      map.set(name, { amount: prev.amount + i.amount, count: prev.count + 1 });
    });
    return [...map.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 3)
      .map(([name, v]) => ({ name, ...v }));
  }, [invoices]);

  // ---- Filtered list ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!withinRange(i, dateRange)) return false;
      if (q) {
        const hay = `${i.client} ${i.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, search, statusFilter, dateRange]);

  const handleResend = (inv: InvoiceEntry) => {
    markInvoiceResent(inv.id);
    toast.success(`Invoice re-sent to ${inv.client || "client"}.`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[94vh] overflow-y-auto bg-[#0f172a] border-white/10 p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 text-white">
            <FileText className="size-5 text-orange" strokeWidth={1.5} />
            Invoice History & Stats
          </SheetTitle>
          <SheetDescription>
            Professional overview of every invoice created with Voice-to-Invoice.
          </SheetDescription>
        </SheetHeader>

        {/* KPI overview */}
        <div className="grid grid-cols-3 gap-2.5 px-6 pt-4">
          <KpiCard
            label="Total billed"
            value={formatEuro(kpis.total)}
            hint={`${kpis.count} invoice${kpis.count === 1 ? "" : "s"}`}
            accent="text-white"
          />
          <KpiCard
            label="Paid"
            value={formatEuro(kpis.paid)}
            hint={`${kpis.paidCount} settled`}
            accent="text-emerald-300"
          />
          <KpiCard
            label="Outstanding"
            value={formatEuro(kpis.outstanding)}
            hint={`${kpis.count - kpis.paidCount} open`}
            accent="text-orange"
          />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-2.5 px-6 pt-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              <Clock className="size-3.5" strokeWidth={1.5} /> Avg. payment time
            </div>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {avgPaymentDays == null ? "—" : `${avgPaymentDays.toFixed(1)} days`}
            </p>
            <p className="text-[11px] text-white/45">
              {avgPaymentDays == null
                ? "Available after your first paid invoice."
                : "From sent to settled."}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              <Users className="size-3.5" strokeWidth={1.5} /> Top clients
            </div>
            {topClients.length === 0 ? (
              <p className="mt-1 text-[12px] text-white/55">No clients yet.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {topClients.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-white/85">{c.name}</span>
                    <span className="font-display font-bold text-orange">
                      {formatEuro(c.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pt-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
              strokeWidth={1.5}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or description…"
              className="intake-input pl-9"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                active={statusFilter === f.key}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DATE_RANGES.map((f) => (
              <FilterChip
                key={f.key}
                active={dateRange === f.key}
                onClick={() => setDateRange(f.key)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Invoice list */}
        <div className="px-6 pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Invoices ({filtered.length})
            </h4>
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => {
                const label = filtered.length === invoices.length ? "all" : "filtered";
                downloadDatevCsv(filtered);
                toast.success(
                  `Exported ${filtered.length} ${label} invoice${filtered.length === 1 ? "" : "s"} for DATEV.`,
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-[11px] font-semibold text-orange hover:bg-orange/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="size-3" strokeWidth={1.75} />
              Export for DATEV (CSV)
            </button>
          </div>

          <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.03]">
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-white/50">
                {invoices.length === 0
                  ? "No invoices yet. Use “Voice to Invoice” to create one."
                  : "No invoices match those filters."}
              </li>
            )}
            {filtered.map((inv) => {
              const meta = STATUS_META[inv.status];
              return (
                <li key={inv.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/90">
                        {inv.client || "Unnamed client"}
                      </p>
                      <p className="truncate text-[11px] text-white/45">
                        {formatDate(inv.date)}
                        {inv.description ? ` · ${inv.description}` : ""}
                      </p>
                      {inv.lastResendAt && (
                        <p className="mt-0.5 text-[10px] text-sky-300/80">
                          Re-sent {new Date(inv.lastResendAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-display text-sm font-bold text-orange">
                        {formatEuro(inv.amount)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResend(inv)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/20"
                    >
                      <Send className="size-3" strokeWidth={1.5} /> Resend Invoice
                    </button>
                    {inv.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceStatus(inv.id, "paid");
                          toast.success("Marked as paid.");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
                      >
                        <Landmark className="size-3" strokeWidth={1.5} /> Mark paid
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this invoice?")) {
                          deleteInvoice(inv.id);
                          toast.success("Invoice deleted.");
                        }
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-white/50 hover:bg-white/5 hover:text-orange"
                      aria-label="Delete invoice"
                    >
                      <Trash2 className="size-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Setup toggle */}
        <div className="px-6 pt-6">
          <button
            type="button"
            onClick={() => setShowSetup((s) => !s)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[13px] font-medium text-white/85 hover:border-orange/40"
          >
            <span className="inline-flex items-center gap-2">
              <Settings2 className="size-4 text-orange" strokeWidth={1.5} />
              Template & legal information
            </span>
            <span className="text-[11px] text-white/50">
              {missing.length > 0 ? `${missing.length} missing` : "Complete"}
            </span>
          </button>
        </div>

        {showSetup && (
          <>
            {/* Template picker */}
            <div className="px-6 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                Invoice template
              </h4>
              <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                {templateFile ? (
                  <div className="flex items-center gap-3">
                    <FileText className="size-6 text-orange" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{templateFile.name}</p>
                      <p className="text-[11px] text-white/45">
                        Custom template · {(templateFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceTemplateFile(null);
                        toast.success("Reverted to auto-generated template.");
                      }}
                      className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-orange"
                      aria-label="Remove custom template"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Sparkles className="size-6 text-orange" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        Auto-generated professional template
                      </p>
                      <p className="text-[11px] text-white/45">
                        Built from your account information. Upload your own to override.
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,.docx"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
                >
                  <Upload className="h-4 w-4" strokeWidth={1.25} />
                  {templateFile ? "Replace template" : "Upload custom template"}
                </button>
              </div>
            </div>

            {/* Company & legal info */}
            <div className="px-6 pt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Company & legal information
                </h4>
                <button
                  type="button"
                  onClick={() => setShowLegalForm((s) => !s)}
                  className="text-[11px] font-medium text-orange underline-offset-4 hover:underline"
                >
                  {showLegalForm ? "Hide" : "Edit"}
                </button>
              </div>

              {missing.length > 0 ? (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/10 p-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange"
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0 flex-1 text-[12px] text-orange">
                    <p className="font-semibold">Missing for a legally-complete template:</p>
                    <p className="mt-0.5 text-orange/90">{missing.join(" · ")}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300"
                    strokeWidth={1.5}
                  />
                  <p className="text-[12px] text-emerald-200">
                    All legal fields present — invoices will render with your full imprint.
                  </p>
                </div>
              )}

              {showLegalForm && (
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                  {[...REQUIRED_LEGAL_KEYS, ...OPTIONAL_LEGAL_KEYS].map(({ key }) => {
                    const meta = FIELD_META[key];
                    return (
                      <div key={key}>
                        <Label htmlFor={`legal-${key}`} className="text-[11px] text-white/70">
                          {meta.label}
                        </Label>
                        <Input
                          id={`legal-${key}`}
                          value={(company[key] as string) ?? ""}
                          placeholder={meta.placeholder}
                          onChange={(e) =>
                            updateCompanyLegalInfo({ [key]: e.target.value } as CompanyLegalInfo)
                          }
                          className="intake-input mt-1"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <div className="px-6 pb-8 pt-6">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" strokeWidth={1.5} /> Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
        <CircleDollarSign className="size-3" strokeWidth={1.5} /> {label}
      </div>
      <p className={cn("mt-1 font-display text-base font-bold leading-tight", accent)}>{value}</p>
      <p className="text-[10px] text-white/45">{hint}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-orange bg-orange/15 text-orange"
          : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white/90",
      )}
    >
      {children}
    </button>
  );
}
