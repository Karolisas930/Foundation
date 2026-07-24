/**
 * TripsPanel — km totals + recent trips list.
 *
 * Uses the shared `KmTrackerQuickModal` as the single source of truth for
 * logging trips (same modal launched from the sidebar Finance → KM Tracker
 * quick action) so the flow is identical everywhere in the app.
 */
import { useState } from "react";
import { Car, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KmTrackerSheet } from "@/features/contractor/tools/components/KmTrackerSheet";

export interface TripRow {
  id: string;
  trip_date: string;
  from_location: string;
  to_location: string;
  km: number;
  purpose: string | null;
}

interface Props {
  userId: string;
  trips: TripRow[];
  kmRateCents: number;
  onChange: () => void;
}

export function TripsPanel({ trips, kmRateCents, onChange }: Props) {
  const [open, setOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  const totalKm = trips.reduce((s, t) => s + Number(t.km), 0);
  const totalDeductionEUR = (totalKm * kmRateCents) / 100;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTrips = trips.filter((t) => t.trip_date.startsWith(monthKey));
  const monthKm = monthTrips.reduce((s, t) => s + Number(t.km), 0);
  const monthDeduction = (monthKm * kmRateCents) / 100;

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="This month"
          value={`${monthKm.toFixed(0)} km`}
          sub={`${monthDeduction.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })} deductible`}
        />
        <StatCard
          label="Year to date"
          value={`${totalKm.toFixed(0)} km`}
          sub={`${totalDeductionEUR.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })} deductible`}
        />
      </div>

      {/* Log trip CTA — opens the shared Kilometer Tax Tracker modal */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4">
        <div className="min-w-0 pr-3">
          <h4 className="font-semibold text-foreground">Log a business trip</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Auto-fill from an active booking · €{(kmRateCents / 100).toFixed(2)}/km Finanzamt
            deduction.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-orange text-navy-ink hover:bg-orange/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Log trip
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <h4 className="mb-3 font-semibold text-foreground">Recent trips</h4>
        {trips.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Car className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No trips yet. Log your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {trips.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">
                    {t.from_location} → {t.to_location}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.trip_date}
                    {t.purpose ? ` · ${t.purpose}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {Number(t.km).toFixed(0)} km
                  </div>
                  <div className="text-xs text-orange">
                    {((Number(t.km) * kmRateCents) / 100).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  aria-label="Delete trip"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <KmTrackerSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-orange">{sub}</div>
    </div>
  );
}
