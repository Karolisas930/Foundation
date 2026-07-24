/**
 * Downloads & Reports page.
 *
 * Central export hub for the contractor's own financial + operational data.
 * All queries are RLS-scoped to the signed-in user via `owner_id = auth.uid()`.
 *
 * Provides CSV/PDF exports for:
 *   - Invoices (PDF + CSV)
 *   - Receipts (CSV)
 *   - Staff hours summary (CSV)
 *   - Km / trip logs (CSV)
 *   - Full GDPR data export (JSON — "what data do you hold about me?")
 *
 * Every export honours the from/to date filter chosen at the top of the page.
 */
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Receipt,
  Users,
  Route as RouteIcon,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";
import { hasPremiumAccess } from "@/config/billing.config";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ------------- helpers -------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFromISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.map((c) => csvEscape(String(c))).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return header + "\n" + body;
}

function download(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function centsToEuro(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toFixed(2);
}

// ------------- page -------------

type Kind = "invoices-pdf" | "invoices-csv" | "receipts" | "hours" | "trips" | "gdpr";

export function DownloadsReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [from, setFrom] = useState<string>(defaultFromISO());
  const [to, setTo] = useState<string>(todayISO());
  const [busy, setBusy] = useState<Kind | null>(null);

  const rangeLabel = useMemo(() => `${from} → ${to}`, [from, to]);

  function assertRange(): boolean {
    if (!from || !to) {
      toast.error("Choose a date range first");
      return false;
    }
    if (from > to) {
      toast.error("'From' date must be before 'To' date");
      return false;
    }
    return true;
  }

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, number, client_name, client_email, status, currency, net_total, gross_total, vat_amount, vat_rate, issued_at, sent_at, created_at",
      )
      .eq("owner_id", userId!)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async function fetchReceipts() {
    const { data, error } = await supabase
      .from("receipts")
      .select("id, vendor, category, purpose, amount_cents, receipt_date, created_at")
      .eq("owner_id", userId!)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("receipt_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async function fetchTrips() {
    const { data, error } = await supabase
      .from("trips")
      .select("id, trip_date, purpose, from_location, to_location, km, notes, created_at")
      .eq("owner_id", userId!)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("trip_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async function fetchStaffHours() {
    const { data, error } = await supabase
      .from("staff_hours")
      .select("id, member_id, member_name, work_date, hours, notes, created_at")
      .eq("owner_id", userId!)
      .gte("work_date", from)
      .lte("work_date", to)
      .order("work_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async function run(kind: Kind, fn: () => Promise<void>, successMsg: string) {
    if (!userId) {
      toast.error("Sign in first");
      return;
    }
    if (!assertRange()) return;
    setBusy(kind);
    try {
      await fn();
      toast.success(successMsg, {
        description: `Range: ${rangeLabel}`,
      });
    } catch (e) {
      console.error("[Reports]", kind, e);
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  // ------------- exporters -------------

  async function exportInvoicesCsv() {
    const rows = await fetchInvoices();
    const mapped = rows.map((r: any) => ({
      number: r.number ?? r.id,
      client: r.client_name ?? "",
      email: r.client_email ?? "",
      status: r.status,
      currency: r.currency,
      net: centsToEuro(r.net_total as number | null),
      vat: centsToEuro(r.vat_amount as number | null),
      gross: centsToEuro(r.gross_total as number | null),
      issued_at: r.issued_at ?? "",
      created_at: r.created_at,
    }));
    const csv = toCSV(mapped, [
      "number",
      "client",
      "email",
      "status",
      "currency",
      "net",
      "vat",
      "gross",
      "issued_at",
      "created_at",
    ]);
    download(`invoices_${from}_${to}.csv`, csv, "text/csv;charset=utf-8");
  }

  async function exportInvoicesPdf() {
    const rows = await fetchInvoices();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    doc.setFontSize(16);
    doc.text("Invoices Summary", margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Range: ${from} → ${to}`, margin, y);
    y += 14;
    doc.text(`Total invoices: ${rows.length}`, margin, y);
    y += 18;
    doc.setTextColor(0);

    doc.setFontSize(9);
    const cols = ["Number", "Client", "Status", "Net", "VAT", "Gross", "Issued"];
    const colX = [
      margin,
      margin + 90,
      margin + 230,
      margin + 290,
      margin + 340,
      margin + 390,
      margin + 445,
    ];
    doc.setFont("helvetica", "bold");
    cols.forEach((c, i) => doc.text(c, colX[i], y));
    doc.setFont("helvetica", "normal");
    y += 12;
    doc.setDrawColor(200);
    doc.line(margin, y - 6, 555, y - 6);

    let totalNet = 0;
    let totalGross = 0;

    for (const r of rows) {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      const net = Number(r.net_total ?? 0);
      const gross = Number(r.gross_total ?? 0);
      const vat = Number(r.vat_amount ?? 0);
      totalNet += net;
      totalGross += gross;
      const row = [
        String(r.number ?? r.id).slice(0, 14),
        String(r.client_name ?? "").slice(0, 22),
        String(r.status ?? ""),
        centsToEuro(net),
        centsToEuro(vat),
        centsToEuro(gross),
        (r.issued_at ?? r.created_at ?? "").slice(0, 10),
      ];
      row.forEach((c, i) => doc.text(c, colX[i], y));
      y += 14;
    }

    y += 8;
    doc.setDrawColor(180);
    doc.line(margin, y, 555, y);
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Totals — Net: ${centsToEuro(totalNet)}  Gross: ${centsToEuro(totalGross)} EUR`,
      margin,
      y,
    );

    doc.save(`invoices_${from}_${to}.pdf`);
  }

  async function exportReceipts() {
    const rows = await fetchReceipts();
    const mapped = rows.map((r: any) => ({
      receipt_date: r.receipt_date ?? "",
      vendor: r.vendor ?? "",
      category: r.category ?? "",
      purpose: r.purpose ?? "",
      amount_eur: centsToEuro(r.amount_cents as number | null),
      created_at: r.created_at,
    }));
    const csv = toCSV(mapped, [
      "receipt_date",
      "vendor",
      "category",
      "purpose",
      "amount_eur",
      "created_at",
    ]);
    download(`receipts_${from}_${to}.csv`, csv, "text/csv;charset=utf-8");
  }

  async function exportStaffHours() {
    const rows = await fetchStaffHours();

    // Per-member summary
    const summary = new Map<string, { name: string; hours: number; days: number }>();
    for (const r of rows) {
      const key = r.member_id ?? "unknown";
      const entry = summary.get(key) ?? {
        name: r.member_name ?? key,
        hours: 0,
        days: 0,
      };
      entry.hours += Number(r.hours ?? 0);
      entry.days += 1;
      summary.set(key, entry);
    }

    const detailCsv = toCSV(
      rows.map((r: any) => ({
        work_date: r.work_date,
        member_id: r.member_id,
        member_name: r.member_name ?? "",
        hours: Number(r.hours ?? 0),
        notes: r.notes ?? "",
      })),
      ["work_date", "member_id", "member_name", "hours", "notes"],
    );

    const summaryCsv = toCSV(
      Array.from(summary.entries()).map(([id, v]) => ({
        member_id: id,
        member_name: v.name,
        total_hours: v.hours,
        days_worked: v.days,
      })),
      ["member_id", "member_name", "total_hours", "days_worked"],
    );

    const combined =
      `# Staff hours summary (${from} to ${to})\n` +
      summaryCsv +
      `\n\n# Detailed entries\n` +
      detailCsv;

    download(`staff_hours_${from}_${to}.csv`, combined, "text/csv;charset=utf-8");
  }

  async function exportTrips() {
    const rows = await fetchTrips();
    const totalKm = rows.reduce((acc: number, r: any) => acc + Number(r.km ?? 0), 0);
    const mapped = rows.map((r: any) => ({
      trip_date: r.trip_date ?? "",
      purpose: r.purpose ?? "",
      from: r.from_location ?? "",
      to: r.to_location ?? "",
      km: Number(r.km ?? 0),
      notes: r.notes ?? "",
    }));
    const csv =
      toCSV(mapped, ["trip_date", "purpose", "from", "to", "km", "notes"]) +
      `\n\n# Total km: ${totalKm.toFixed(1)}\n`;
    download(`trips_${from}_${to}.csv`, csv, "text/csv;charset=utf-8");
  }

  async function exportGdpr() {
    const [{ data: profile }, { data: settings }, invoices, receipts, trips, hours] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("finanz_settings").select("*").eq("user_id", userId!).maybeSingle(),
        fetchInvoices(),
        fetchReceipts(),
        fetchTrips(),
        fetchStaffHours(),
      ]);

    const bundle = {
      export_generated_at: new Date().toISOString(),
      range: { from, to },
      account: {
        id: user?.id,
        email: user?.email,
        created_at: user?.created_at,
        user_metadata: user?.user_metadata ?? null,
      },
      profile: profile ?? null,
      finanz_settings: settings ?? null,
      invoices,
      receipts,
      trips,
      staff_hours: hours,
      _notice:
        "GDPR Art. 15 subject access export. Data is scoped to the signed-in user via row-level security.",
    };

    download(
      `gdpr_data_export_${from}_${to}.json`,
      JSON.stringify(bundle, null, 2),
      "application/json",
    );
  }

  // ------------- render -------------

  if (authLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!userId) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-300">
          <h2 className="text-xl font-semibold text-white">Sign in to open Downloads & Reports</h2>
          <p className="mt-2 text-sm">
            Your invoices, receipts and staff data are private to your account.
          </p>
        </div>
      </PageShell>
    );
  }

  // Premium gate: DATEV / accountant export is locked behind an active
  // trial or subscription when IS_MONETIZATION_ENABLED is true. When the
  // master toggle is false, `hasPremiumAccess()` always returns true, so
  // every card is unlocked for every user.
  const premiumUnlocked = hasPremiumAccess();

  const cards: Array<{
    kind: Kind;
    icon: typeof FileText;
    title: string;
    desc: string;
    action: () => Promise<void>;
    label: string;
    premium?: boolean;
  }> = [
    {
      kind: "invoices-pdf",
      icon: FileText,
      title: "All Invoices — PDF",
      desc: "Printable summary of every invoice in the selected range, with net / VAT / gross totals.",
      action: exportInvoicesPdf,
      label: "Download PDF",
    },
    {
      kind: "invoices-csv",
      icon: FileText,
      title: "All Invoices — CSV (DATEV)",
      desc: "Spreadsheet-ready export for your accountant or DATEV.",
      action: exportInvoicesCsv,
      label: "Download CSV",
      premium: true,
    },
    {
      kind: "receipts",
      icon: Receipt,
      title: "All Receipts",
      desc: "Every scanned or manually captured receipt, with vendor, category and amount.",
      action: exportReceipts,
      label: "Download CSV",
    },
    {
      kind: "hours",
      icon: Users,
      title: "Staff Hours Summary",
      desc: "Per-worker totals plus a full breakdown of every logged shift.",
      action: exportStaffHours,
      label: "Download CSV",
    },
    {
      kind: "trips",
      icon: RouteIcon,
      title: "Km / Trip Logs",
      desc: "Kilometer tracker entries with total mileage for the range.",
      action: exportTrips,
      label: "Download CSV",
    },
    {
      kind: "gdpr",
      icon: ShieldCheck,
      title: "Full Data Export (GDPR)",
      desc: "'What data do you hold about me?' — a single JSON with account, profile, settings, invoices, receipts, trips and hours.",
      action: exportGdpr,
      label: "Download JSON",
    },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange text-navy-ink">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Downloads & Reports</h1>
            <p className="text-xs text-slate-400">
              Export your invoices, receipts, staff hours, trips and a full GDPR data package.
            </p>
          </div>
        </header>

        {/* Date range filter */}
        <section className="rounded-2xl border border-white/10 bg-navy-deep/60 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Date range</h2>
            <p className="text-xs text-slate-400">Applied to every download below.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="from" className="text-xs text-slate-300">
                From
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 border-white/15 bg-white/5 text-white"
              />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs text-slate-300">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 border-white/15 bg-white/5 text-white"
              />
            </div>
          </div>
        </section>

        {/* Cards grid */}
        <section className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            const isBusy = busy === c.kind;
            const locked = !!c.premium && !premiumUnlocked;
            return (
              <div
                key={c.kind}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-navy-deep/60 p-5"
              >
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-orange">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                    {locked && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-semibold text-orange">
                        <Lock className="h-3 w-3" /> Premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{c.desc}</p>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    disabled={!!busy || locked}
                    onClick={() => run(c.kind, c.action, `${c.title} downloaded`)}
                    className="w-full gap-2"
                  >
                    {locked ? (
                      <Lock className="h-4 w-4" />
                    ) : isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {locked ? "Upgrade to unlock" : isBusy ? "Preparing…" : c.label}
                  </Button>
                </div>
              </div>
            );
          })}
        </section>

        <p className="text-center text-[11px] text-slate-500">
          All exports are generated in your browser and never leave your device except when you save
          them.
        </p>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-navy-ink text-slate-50">
      <TopBar showMenu />
      <div className="pb-24">{children}</div>
      <BottomBar />
    </div>
  );
}
