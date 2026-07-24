// Small helper — Cloud is enabled, but keeps prior call sites compiling.
// Also honors the in-app runtime override so users can bring their own
// Supabase project via the /supabase-setup page without rebuilding.
import { loadSupabaseRuntimeConfig } from "./runtime-config";

export function isSupabaseConfigured(): boolean {
  const runtime = loadSupabaseRuntimeConfig();
  if (runtime) return true;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}
