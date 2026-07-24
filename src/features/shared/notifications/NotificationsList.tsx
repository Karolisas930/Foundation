/**
 * Minimal notifications drawer content: lists the signed-in user's
 * notifications with a read/unread badge and a "Mark all read" action.
 * Realtime-updated via useUnreadNotifications side channel (a refresh
 * on any change to the current user's rows).
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Bell } from "lucide-react";

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  sender_id: string;
};

export function NotificationsList() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id, type, message, read, created_at, sender_id")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && Array.isArray(data)) setRows(data as NotificationRow[]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    void load();
    const channel = supabase
      .channel(`notifications-list:${userId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, userId, load]);

  async function markAllRead() {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("read", false);
    void load();
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Sign in to see your notifications.</div>
    );
  }

  const unread = rows.filter((r) => !r.read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {unread > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            Mark all read ({unread})
          </button>
        )}
      </div>

      {loading && rows.length === 0 && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && rows.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Bell className="h-6 w-6 opacity-60" />
          <p className="text-sm">You're all caught up.</p>
        </div>
      )}

      <ul className="divide-y divide-border rounded-lg border">
        {rows.map((n) => (
          <li
            key={n.id}
            className={
              "flex items-start gap-3 p-3 " +
              (n.read ? "opacity-70" : "bg-amber-50/40 dark:bg-amber-500/5")
            }
          >
            <span
              aria-hidden
              className={
                "mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full " +
                (n.read ? "bg-muted-foreground/40" : "bg-amber-500")
              }
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono uppercase tracking-wide">
                  {n.type}
                </span>
                <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-1 truncate text-sm">{n.message || "—"}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotificationsList;
