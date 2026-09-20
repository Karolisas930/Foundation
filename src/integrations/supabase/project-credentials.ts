/**
 * Public Supabase project credentials (public values only).
 *
 * There are intentionally NO hardcoded project URL/key fallbacks here. An old
 * hardcoded project reference used to live in this file and silently pointed
 * the app at a backend that is no longer the project's backend. Credentials
 * now come from configuration only:
 *
 *   1. VITE_SUPABASE_* / SUPABASE_* environment variables (set by the Lovable
 *      connector or by a hosting provider such as Vercel)
 *   2. the in-app /supabase-setup page (browser only, stored in localStorage)
 *
 * NEVER put the service-role key in this file — it belongs in the encrypted
 * secret store as SUPABASE_SERVICE_ROLE_KEY.
 */

/** Public Supabase URL from the environment, or empty when not configured. */
export function resolveSupabaseUrl(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]);
  return ((fromEnv as string | undefined) || "").trim();
}

/** Public publishable/anon key from the environment, or empty when not configured. */
export function resolveSupabasePublishableKey(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"]) ||
    (typeof process !== "undefined" && process.env?.["SUPABASE_PUBLISHABLE_KEY"]);
  return ((fromEnv as string | undefined) || "").trim();
}
