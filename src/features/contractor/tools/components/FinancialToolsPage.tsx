/**
 * FinancialToolsPage — Finanzamt Reserve dashboard + Receipts + Trips.
 *
 * Uses the browser Supabase client + RLS. All rows are scoped to the signed-in
 * contractor via `owner_id = auth.uid()`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Percent, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanzReserveGauge } from "@/features/contractor/tools/components/FinanzReserveGauge";
import {
  ReserveChart,
  type ReserveMonthPoint,
} from "@/features/contractor/tools/components/ReserveChart";
import {
  ReceiptsPanel,
  type ReceiptRow,
} from "@/features/contractor/tools/components/ReceiptsPanel";
import { TripsPanel, type TripRow } from "@/features/contractor/tools/components/TripsPanel";

interface Settings {
  reserve_percent: number;
  km_rate_cents: number;
}

interface InvoiceLite {
  net_total: number | string;
  issued_at: string | null;
  created_at: string;
  status: string;
}

export function FinancialToolsPage({
  initialTab,
  scanOnOpen,
}: {
  initialTab?: "receipts" | "trips";
  scanOnOpen?: boolean;
} = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    reserve_percent: 30,
    km_rate_cents: 30,
  });
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceLite[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Settings (upsert row if missing)
    const { data: settingsRow } = await supabase
      .from("finanz_settings")
      .select("reserve_percent, km_rate_cents")
      .eq("user_id", userId)
      .maybeSingle();
    if (!settingsRow) {
      await supabase.from("finanz_settings").insert({ user_id: userId }).select().maybeSingle();
    } else {
      setSettings({
        reserve_percent: Number(settingsRow.reserve_percent),
        km_rate_cents: Number(settingsRow.km_rate_cents),
      });
    }

    const [{ data: r }, { data: t }, { data: inv }] = await Promise.all([
      supabase
        .from("receipts")
        .select("id, receipt_date, vendor, amount_cents, category, file_path, file_mime")
        .eq("owner_id", userId)
        .order("receipt_date", { ascending: false })
        .limit(200),
      supabase
        .from("trips")
        .select("id, trip_date, from_location, to_location, km, purpose")
        .eq("owner_id", userId)
        .order("trip_date", { ascending: false })
        .limit(200),
      supabase
        .from("invoices")
        .select("net_total, issued_at, created_at, status")
        .eq("owner_id", userId)
        .in("status", ["sent", "paid"])
        .limit(500),
    ]);

    setReceipts((r ?? []) as ReceiptRow[]);
    setTrips((t ?? []) as TripRow[]);
    setInvoices((inv ?? []) as InvoiceLite[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  // Realtime — auto-refresh the Finanzamt gauge whenever a trip is inserted,
  // updated, or deleted (e.g. from the KM Tracker quick-action modal in the
  // side menu). Scoped to the signed-in owner via RLS + explicit filter.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`finanz-trips-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trips",
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Monthly net revenue for current month (from invoices)
  const netRevenueMonth = useMemo(() => {
    return invoices
      .filter((i) => (i.issued_at ?? i.created_at).startsWith(monthKey))
      .reduce((s, i) => s + Number(i.net_total ?? 0), 0);
  }, [invoices, monthKey]);

  // Reserve on hand = year-to-date net revenue * reserve% — receipts already offset (deductible expenses)
  const reserveOnHand = useMemo(() => {
    const ytdRevenue = invoices
      .filter((i) => (i.issued_at ?? i.created_at).startsWith(String(now.getFullYear())))
      .reduce((s, i) => s + Number(i.net_total ?? 0), 0);
    const ytdExpenses =
      receipts
        .filter((r) => r.receipt_date.startsWith(String(now.getFullYear())))
        .reduce((s, r) => s + r.amount_cents, 0) / 100;
    const kmDeduction =
      (trips
        .filter((t) => t.trip_date.startsWith(String(now.getFullYear())))
        .reduce((s, t) => s + Number(t.km), 0) *
        settings.km_rate_cents) /
      100;
    const taxable = Math.max(0, ytdRevenue - ytdExpenses - kmDeduction);
    return (taxable * settings.reserve_percent) / 100;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, receipts, trips, settings.reserve_percent, settings.km_rate_cents]);

  const monthlyChart = useMemo<ReserveMonthPoint[]>(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: d.toLocaleString("en", { month: "short" }),
      };
    });
    return months.map(({ key, label }) => {
      const revenue = invoices
        .filter((i) => (i.issued_at ?? i.created_at).startsWith(key))
        .reduce((s, i) => s + Number(i.net_total ?? 0), 0);
      return {
        month: label,
        revenue: Math.round(revenue),
        reserve: Math.round((revenue * settings.reserve_percent) / 100),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, settings.reserve_percent]);

  async function updateReservePercent(pct: number) {
    if (!userId) return;
    const clamped = Math.max(0, Math.min(60, pct));
    setSettings((s) => ({ ...s, reserve_percent: clamped }));
    await supabase
      .from("finanz_settings")
      .upsert({ user_id: userId, reserve_percent: clamped }, { onConflict: "user_id" });
  }

  if (authLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      </PageShell>
    );
  }

  if (!userId) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-300">
          <h2 className="text-xl font-semibold text-white">Sign in to open Finanz</h2>
          <p className="mt-2 text-sm">
            Your receipts, trips and Finanzamt reserve are private to your account.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange text-navy-ink">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Tools</h1>
            <p className="text-xs text-slate-400">
              Finanzamt reserve, receipts & km — all in one place.
            </p>
          </div>
        </header>

        {/* Reserve dashboard */}
        <section className="rounded-2xl border border-white/10 bg-navy-deep/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Finanzamt reserve</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="pct" className="text-xs text-slate-300">
                Reserve %
              </Label>
              <div className="relative">
                <Input
                  id="pct"
                  type="number"
                  min={0}
                  max={60}
                  step={1}
                  value={settings.reserve_percent}
                  onChange={(e) => updateReservePercent(Number(e.target.value))}
                  className="h-8 w-20 border-white/15 bg-white/5 pr-6 text-right text-white"
                />
                <Percent className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <FinanzReserveGauge
              reservePercent={settings.reserve_percent}
              netRevenueMonthEUR={netRevenueMonth}
              reserveOnHandEUR={reserveOnHand}
            />
            <ReserveChart data={monthlyChart} />
          </div>
        </section>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading data…
          </div>
        )}

        {/* Receipts + Trips */}
        <Tabs defaultValue={initialTab ?? "receipts"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-navy-deep/60">
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="trips">Km / Trips</TabsTrigger>
          </TabsList>
          <TabsContent value="receipts" className="mt-4">
            <ReceiptsPanel
              userId={userId}
              receipts={receipts}
              onChange={load}
              autoOpenScanner={scanOnOpen}
            />
          </TabsContent>
          <TabsContent value="trips" className="mt-4">
            <TripsPanel
              userId={userId}
              trips={trips}
              kmRateCents={settings.km_rate_cents}
              onChange={load}
            />
          </TabsContent>
        </Tabs>
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
