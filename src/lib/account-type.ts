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

    const { data: existing, error: readError } = await supabase
      .from("profiles")
      .select("id, account_type, display_name")
      .eq("id", user.id)
      .maybeSingle();

    // If we could not read the row we do NOT know the role — writing a
    // default here would overwrite a real contractor profile.
    if (readError) return;

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

const PENDING_PROFILE_FIELDS_KEY = "hw.pendingProfileFields.v1";

/**
 * The homeowner "secure your account" dialog collects full_name/phone
 * client-side before the account exists. The password path can upsert
 * them right after signUp(). The OAuth (Google/Apple) path can't — the
 * browser navigates away to the provider and back, unmounting the
 * dialog before any session exists. Stash the values here right before
 * the OAuth redirect; /auth/callback picks them up once a session lands
 * and clears them afterward. Safe no-op if nothing was stashed.
 */
export function stashPendingProfileFields(fields: {
  fullName?: string | null;
  phone?: string | null;
}): void {
  try {
    if (!fields.fullName && !fields.phone) return;
    window.localStorage.setItem(PENDING_PROFILE_FIELDS_KEY, JSON.stringify(fields));
  } catch {
    /* storage unavailable — the profile can still be edited later */
  }
}

export async function applyPendingProfileFieldsIfAny(): Promise<void> {
  try {
    const raw = window.localStorage.getItem(PENDING_PROFILE_FIELDS_KEY);
    if (!raw) return;
    window.localStorage.removeItem(PENDING_PROFILE_FIELDS_KEY);

    const { fullName, phone } = JSON.parse(raw) as { fullName?: string; phone?: string };
    if (!fullName && !phone) return;

    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) return;

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        ...(fullName ? { full_name: fullName, display_name: fullName } : {}),
        ...(phone ? { phone } : {}),
      },
      { onConflict: "id" },
    );
  } catch {
    /* non-fatal — a later profile edit will fill these in */
  }
}

/**
 * Contractor sign-up stores the whole onboarding profile on the account
 * (user_metadata) because no session exists until the email is confirmed.
 * Once a session lands, copy those fields into `profiles` — only filling
 * columns that are still empty so later edits are never overwritten.
 */
export async function syncContractorMetadataToProfile(): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const user = sess?.session?.user;
    if (!user) return;
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (!m.business_name && !Array.isArray(m.trades) && !m.service_radius_km) return;
    const { data: row } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    const cur = (row ?? {}) as Record<string, unknown>;
    const empty = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
    const wanted: Record<string, unknown> = {
      full_name: m.full_name,
      company_name: m.business_name,
      display_name: m.business_name || m.full_name,
      phone: m.phone,
      city: m.city,
      postal_code: m.postal_code,
      address_line1: m.street_address,
      service_radius_km: m.service_radius_km,
      min_project_size: m.min_project_size,
      trades: m.trades,
      languages: m.languages,
      bio: m.bio,
    };
    const patch: Record<string, unknown> = { id: user.id };
    for (const [k, v] of Object.entries(wanted)) {
      if (!empty(v) && (empty(cur[k]) || (k === "languages" && JSON.stringify(cur[k]) === '["de"]'))) patch[k] = v;
    }
    if (Object.keys(patch).length > 1) {
      await supabase.from("profiles").upsert(patch as never, { onConflict: "id" });
    }
  } catch (err) {
    console.error("[profile sync] contractor metadata sync failed", err);
  }
}
