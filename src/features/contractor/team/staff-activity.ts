/**
 * Lightweight staff activity log for the tradesperson dashboard.
 *
 * Persists to localStorage with a pub/sub channel so the Recent Activity
 * panel updates in real time. New activity is also mirrored (best-effort)
 * to the Supabase `notifications` table so it surfaces in the Alerts tab.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StaffActivityKind = "photo" | "receipt" | "hours" | "note";

export type StaffActivity = {
  id: string;
  kind: StaffActivityKind;
  actor: string;
  message: string;
  amount?: number;
  createdAt: number;
};

const KEY = "hw:staff-activity:v1";
const EVT = "hw:staff-activity:update";
const MAX = 40;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadActivity(): StaffActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StaffActivity[];
    const demo = new Set(["Luke", "Anna", "Marco"]);
    return Array.isArray(parsed) ? parsed.filter((a) => !demo.has(a.actor)) : [];
  } catch {
    return [];
  }
}

function save(list: StaffActivity[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}

export function subscribeActivity(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
  };
}

/**
 * Record a new staff activity. Persists locally, pings subscribers,
 * and (best-effort) writes a matching row to the Alerts feed.
 */
export function recordStaffActivity(
  input: Omit<StaffActivity, "id" | "createdAt"> & { createdAt?: number },
): StaffActivity {
  const entry: StaffActivity = {
    id: uid(),
    createdAt: input.createdAt ?? Date.now(),
    ...input,
  };
  const next = [entry, ...loadActivity()];
  save(next);
  void pushToAlerts(entry);
  return entry;
}

async function pushToAlerts(entry: StaffActivity) {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    const message =
      entry.amount != null
        ? `${entry.actor} ${entry.message} — €${entry.amount.toLocaleString("de-DE")}`
        : `${entry.actor} ${entry.message}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("notifications").insert({
      recipient_id: uid,
      sender_id: uid,
      type: `staff_${entry.kind}`,
      message,
      read: false,
    });
  } catch {
    /* alerts are best-effort */
  }
}

export function useStaffActivity(): StaffActivity[] {
  const [list, setList] = useState<StaffActivity[]>(() => loadActivity());
  useEffect(() => {
    setList(loadActivity());
    const off = subscribeActivity(() => setList(loadActivity()));
    return off;
  }, []);

  // Realtime bridge: mirror new staff_hours rows for the current user into
  // the activity feed so hours logged from TeamManagement appear instantly.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      channel = supabase
        .channel(`staff-activity:${uid}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "staff_hours",
            filter: `owner_id=eq.${uid}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const row = payload?.new ?? {};
            const hours = Number(row.hours ?? 0);
            const who = row.member_name || "Team member";
            const note = row.notes ? ` — ${row.notes}` : "";
            recordStaffActivity({
              kind: "hours",
              actor: who,
              message: `logged ${hours.toFixed(2)}h${note}`,
            });
          },
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return list;
}
