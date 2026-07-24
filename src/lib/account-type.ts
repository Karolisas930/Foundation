/**
 * Shared helper — stamp `profiles.account_type` for the currently signed-in
 * user. Idempotent by design: `stampIfMissing` only writes when the row is
 * missing or `account_type` is null, so it's safe to call on every dashboard
 * mount without clobbering an existing role (contractor upgrades, admin
 * overrides, etc.).
 *
 * Used by:
 *  - SuccessScreen (password signup / update paths).
 *  - homeowner/index.tsx first-load check (covers magic-link + OAuth
 *    returns that redirect through /dashboard?sector=homeowner).
 */
import { supabase } from "@/integrations/supabase/client";

export async function stampAccountTypeIfMissing(
  accountType: "homeowner" | "handyman" | "business" | "architect",
  displayNameFallback?: string | null,
): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id, account_type")
      .eq("id", user.id)
      .maybeSingle();

    const currentType = (existing as { account_type: string | null } | null)?.account_type;
    if (currentType) return; // already set — do not overwrite

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        account_type: accountType,
        display_name:
          (existing as { display_name?: string | null } | null)?.display_name ??
          displayNameFallback ??
          user.email ??
          null,
      },
      { onConflict: "id" },
    );
  } catch {
    /* non-fatal — a later save will backfill the row */
  }
}
