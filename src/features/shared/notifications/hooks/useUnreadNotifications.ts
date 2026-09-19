/**
 * Realtime unread-notifications counter for the signed-in user.
 *
 * - Initial count fetched via a HEAD count query.
 * - Live INSERT/UPDATE/DELETE events on `public.notifications` filtered
 *   to the current user refresh the count.
 * - No PII (email/phone) is read; only aggregate + row.read flag.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useUnreadNotifications(): { count: number; loading: boolean } {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function refresh() {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = (supabase as any)
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .eq("read", false);
        const { count: c, error } = await q;
        if (cancelled) return;
        if (error) {
          // Table missing / RLS denied → treat as zero, don't spam console.
          setCount(0);
        } else {
          setCount(typeof c === "number" ? c : 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();

    // Unique topic per effect run: React StrictMode mounts effects twice and
    // reusing a topic that is still subscribed throws "cannot add
    // postgres_changes callbacks ... after subscribe()".
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, userId]);

  return { count, loading };
}
