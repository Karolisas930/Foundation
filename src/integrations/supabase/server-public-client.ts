/**
 * Server-side publishable ("anon") Supabase client.
 *
 * Used by server functions that read public, RLS-protected data without a user
 * session. Credentials come from the environment only — no hardcoded project
 * fallback, so a misconfigured deployment fails loudly instead of quietly
 * talking to the wrong backend.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  throw new Error(
    `Missing required environment variable: ${name}. Connect the Supabase project (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) before using this feature.`,
  );
}

export function createServerPublicClient() {
  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}
