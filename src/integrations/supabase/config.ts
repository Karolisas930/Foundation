// Small helper — keeps prior call sites compiling.
// Credentials resolve as: runtime override (localStorage, set on
// /supabase-setup) > environment variables. There are no hardcoded fallbacks,
// so this returns false until the project is actually connected.
import { loadSupabaseRuntimeConfig } from "./runtime-config";
import { resolveSupabaseUrl, resolveSupabasePublishableKey } from "./project-credentials";

export function isSupabaseConfigured(): boolean {
  const runtime = loadSupabaseRuntimeConfig();
  if (runtime) return true;
  return Boolean(resolveSupabaseUrl() && resolveSupabasePublishableKey());
}
