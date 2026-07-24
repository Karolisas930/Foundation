/**
 * useTaxData — loads invoices, receipts, trips and finanz_settings for the
 * signed-in user when the sheet opens.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DbInvoice, DbReceipt, DbSettings, DbTrip } from "./tax-calc";

export function useTaxData(open: boolean, userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<DbInvoice[]>([]);
  const [receipts, setReceipts] = useState<DbReceipt[]>([]);
  const [trips, setTrips] = useState<DbTrip[]>([]);
  const [settings, setSettings] = useState<DbSettings>({
    reserve_percent: 30,
    km_rate_cents: 30,
  });

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [inv, rec, tr, set] = await Promise.all([
        supabase
          .from("invoices")
          .select(
            "id, number, client_name, client_address, status, document_type, net_total, gross_total, vat_amount, vat_rate, issued_at, created_at",
          )
          .eq("owner_id", userId)
          .in("status", ["sent", "paid", "overdue"])
          .limit(2000),
        supabase
          .from("receipts")
          .select("id, vendor, category, amount_cents, receipt_date, created_at")
          .eq("owner_id", userId)
          .limit(2000),
        supabase
          .from("trips")
          .select("id, purpose, from_location, to_location, km, trip_date, created_at")
          .eq("owner_id", userId)
          .limit(2000),
        supabase
          .from("finanz_settings")
          .select("reserve_percent, km_rate_cents")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setInvoices((inv.data ?? []) as DbInvoice[]);
      setReceipts((rec.data ?? []) as DbReceipt[]);
      setTrips((tr.data ?? []) as DbTrip[]);
      if (set.data) {
        setSettings({
          reserve_percent: Number(set.data.reserve_percent),
          km_rate_cents: Number(set.data.km_rate_cents),
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  return { loading, invoices, receipts, trips, settings };
}
