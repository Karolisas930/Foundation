/**
 * useStaffHoursData — loads staff-hours rows for the current user, exposes
 * mutations (approve/reject/edit) and derived staff/job option lists.
 *
 * Extracted from StaffHoursPage.tsx so the page shell only orchestrates UI.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isUuid, type HoursRow, type Status } from "./staff-hours-utils";

export function useStaffHoursData(userId: string | null) {
  const [rows, setRows] = useState<HoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<string, number>>({});

  // Load per-member hourly rates from public.team_members.hourly_rate.
  // RLS scopes team_members rows to the owner (auth.uid() = owner_id), so
  // this returns only the current user's roster. Rows without a rate set
  // are simply omitted from the map (callers already treat missing as 0).
  useEffect(() => {
    let alive = true;
    if (!userId || !isUuid(userId)) {
      // Demo / non-UUID sessions have no persisted rates.
      setRates({});
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, hourly_rate")
        .eq("owner_id", userId);
      if (!alive) return;
      if (error) {
        console.error("Failed to load staff hourly rates:", error);
        return;
      }
      const next: Record<string, number> = {};
      for (const row of (data ?? []) as { id: string; hourly_rate: number | null }[]) {
        if (row.hourly_rate != null) next[row.id] = Number(row.hourly_rate);
      }
      setRates(next);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const setRate = useCallback(
    (memberId: string, rate: number) => {
      // Optimistic local update — keeps the same return shape as before.
      setRates((prev) => ({ ...prev, [memberId]: rate }));
      if (!userId || !isUuid(userId)) return;
      void (async () => {
        const { error } = await supabase
          .from("team_members")
          .update({ hourly_rate: rate })
          .eq("id", memberId)
          .eq("owner_id", userId);
        if (error) {
          console.error("Failed to save hourly rate:", error);
          toast.error("Failed to save hourly rate");
        }
      })();
    },
    [userId],
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!userId) return;
      setLoading(true);
      if (!isUuid(userId)) {
        if (!alive) return;
        setRows([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("staff_hours")
        .select("id, member_id, member_name, work_date, hours, notes, job, status, created_at")
        .eq("owner_id", userId)
        .order("work_date", { ascending: false })
        .limit(1000);
      if (!alive) return;
      if (error) {
        console.error("Failed to load staff hours:", error);
        toast.error("Failed to load staff hours");
        setRows([]);
      } else {
        const base = ((data ?? []) as HoursRow[]).map((r) => ({
          ...r,
          status: (r.status ?? "pending") as Status,
        }));
        setRows(base);
      }
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [userId]);

  const updateStatus = useCallback(
    (ids: string[] | string, status: Status) => {
      if (!userId) return;
      const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
      setRows((prev) => prev.map((r) => (idSet.has(r.id) ? { ...r, status } : r)));
      if (isUuid(userId) && idSet.size > 0) {
        void (async () => {
          const { error } = await supabase
            .from("staff_hours")
            .update({ status })
            .in("id", Array.from(idSet))
            .eq("owner_id", userId);
          if (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to save status change");
          }
        })();
      }
      const label =
        status === "approved"
          ? "approved"
          : status === "rejected"
            ? "rejected"
            : "reset to pending";
      toast.success(idSet.size === 1 ? `Entry ${label}` : `${idSet.size} entries ${label}`);
    },
    [userId],
  );

  const updateRow = useCallback(
    async (id: string, patch: { hours: number; notes: string | null; job: string | null }) => {
      if (!userId) return;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      if (isUuid(userId)) {
        const { error } = await supabase
          .from("staff_hours")
          .update({ hours: patch.hours, notes: patch.notes, job: patch.job })
          .eq("id", id)
          .eq("owner_id", userId);
        if (error) {
          console.error("Failed to update entry:", error);
          toast.error("Failed to save changes");
          return;
        }
      }
      toast.success("Entry updated");
    },
    [userId],
  );

  const jobOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.job) set.add(r.job);
    return Array.from(set).sort();
  }, [rows]);

  const staffOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (!map.has(r.member_id)) {
        map.set(r.member_id, r.member_name ?? r.member_id);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rows]);

  return {
    rows,
    loading,
    rates,
    setRate,
    updateStatus,
    updateRow,
    jobOptions,
    staffOptions,
  };
}
