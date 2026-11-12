/**
 * Small browser helpers for persisting contractor tool data (invoices,
 * site diary, verification docs) to the database. Tables are not yet in the
 * generated types, so access goes through an untyped handle.
 */
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Run `fn` once on load and again whenever the user signs in. */
export function onSignedIn(fn: (uid: string) => void) {
  if (typeof window === "undefined") return;
  // Never let a missing/misconfigured backend crash the page on load.
  try {
    void currentUserId().then((uid) => uid && fn(uid));
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) fn(session.user.id);
    });
  } catch (err) {
    console.warn("Cloud sync disabled:", err);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "application/octet-stream";
  const bin = atob(b64 ?? "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
