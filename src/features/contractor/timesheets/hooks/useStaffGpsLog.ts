/**
 * useStaffGpsLog — GPS ping log for staff tracking, backed by
 * `public.staff_gps_pings` (RLS: only the owning contractor can read/write).
 *
 * Each ping mirrors `LocationFix` and adds the originating `member_id`
 * (or the current user for self-tracking) and an optional `job` tag.
 * The hook exposes `record()` for appending and `clear()` for wiping the
 * current user's trail.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LocationFix } from "./useLocation";

export interface StaffGpsPing extends LocationFix {
  id: string;
  member_id: string;
  member_name?: string | null;
  job?: string | null;
  recorded_at: string;
}

const MAX_PINGS = 500;

type DbRow = {
  id: string;
  member_id: string;
  member_name: string | null;
  job: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
};

function toPing(r: DbRow): StaffGpsPing {
  return {
    id: r.id,
    member_id: r.member_id,
    member_name: r.member_name,
    job: r.job,
    latitude: r.latitude,
    longitude: r.longitude,
    accuracy: r.accuracy ?? 0,
    // LocationFix.timestamp is a client epoch — reconstruct from recorded_at.
    timestamp: new Date(r.recorded_at).getTime(),
    recorded_at: r.recorded_at,
  };
}

export async function loadStaffGpsLog(userId: string): Promise<StaffGpsPing[]> {
  const { data, error } = await supabase
    .from("staff_gps_pings")
    .select("id, member_id, member_name, job, latitude, longitude, accuracy, recorded_at")
    .eq("owner_id", userId)
    .order("recorded_at", { ascending: true })
    .limit(MAX_PINGS);
  if (error) {
    console.error("Failed to load staff GPS log:", error);
    return [];
  }
  return ((data ?? []) as DbRow[]).map(toPing);
}

export async function appendStaffGpsPing(
  userId: string,
  ping: Omit<StaffGpsPing, "id" | "recorded_at">,
): Promise<StaffGpsPing | null> {
  const { data, error } = await supabase
    .from("staff_gps_pings")
    .insert({
      owner_id: userId,
      member_id: ping.member_id,
      member_name: ping.member_name ?? null,
      job: ping.job ?? null,
      latitude: ping.latitude,
      longitude: ping.longitude,
      accuracy: ping.accuracy,
    })
    .select("id, member_id, member_name, job, latitude, longitude, accuracy, recorded_at")
    .single();
  if (error || !data) {
    console.error("Failed to append staff GPS ping:", error);
    return null;
  }
  return toPing(data as DbRow);
}

export async function clearStaffGpsLog(userId: string): Promise<void> {
  const { error } = await supabase.from("staff_gps_pings").delete().eq("owner_id", userId);
  if (error) console.error("Failed to clear staff GPS log:", error);
}

/**
 * React hook returning the persisted log for a given user and a stable
 * `record()` callback that appends a new fix.
 */
export function useStaffGpsLog(userId: string | null) {
  const [pings, setPings] = useState<StaffGpsPing[]>([]);

  useEffect(() => {
    let alive = true;
    if (!userId) {
      setPings([]);
      return;
    }
    void loadStaffGpsLog(userId).then((rows) => {
      if (alive) setPings(rows);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const record = useCallback(
    async (ping: Omit<StaffGpsPing, "id" | "recorded_at">) => {
      if (!userId) return null;
      const saved = await appendStaffGpsPing(userId, ping);
      if (saved) setPings((prev) => [...prev, saved].slice(-MAX_PINGS));
      return saved;
    },
    [userId],
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    await clearStaffGpsLog(userId);
    setPings([]);
  }, [userId]);

  return { pings, record, clear };
}
