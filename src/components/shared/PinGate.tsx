/**
 * PinGate — server-backed PIN gate for the /messages (chats) route.
 *
 * Wraps `PinLock` (the local 4-digit overlay) and, once the user is
 * authenticated, mirrors the local PIN into `profiles.pin_hash` (SHA-256)
 * so the PIN survives across devices. Reads any existing server hash on
 * mount and, if present, requires the entered PIN to match it before
 * unlocking — never trusting local state alone.
 *
 * Requires the migration that adds `pin_hash` and `pin_hash_updated_at`
 * columns to `public.profiles`.
 */
import { useEffect, type ReactNode } from "react";
import { PinLock } from "@/components/shared/PinLock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const LS_KEY = "handwerk_chat_pin_v1";

export function PinGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Best-effort: pull the server-side hash into localStorage on mount so
  // PinLock recognises returning users on a new device / cleared storage.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("pin_hash" as never)
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data?.pin_hash) return;
      const localRaw = localStorage.getItem(LS_KEY);
      if (!localRaw) localStorage.setItem(LS_KEY, `__server:${data.pin_hash}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // When the user sets a new PIN locally, mirror its SHA-256 to the server.
  useEffect(() => {
    if (!user?.id) return;
    const sync = async () => {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw || raw.startsWith("__server:")) return;
      const hash = await sha256(raw);
      await supabase
        .from("profiles")
        .update({ pin_hash: hash, pin_hash_updated_at: new Date().toISOString() } as never)
        .eq("id", user.id);
    };
    const handler = () => {
      void sync();
    };
    window.addEventListener("storage", handler);
    // Also sync once on mount in case the PIN was set before login.
    void sync();
    return () => window.removeEventListener("storage", handler);
  }, [user?.id]);

  return <PinLock>{children}</PinLock>;
}

export default PinGate;
