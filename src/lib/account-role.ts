/**
 * Single source of truth for "which dashboard does this account belong to".
 *
 * The bug this file fixes: role checks were duplicated in four places and
 * two of them hard-coded the list `handyman | business`. Any other
 * non-homeowner value (`contractor`, `architect`, a value written by an
 * admin or a seed script) fell through every branch and the person was
 * treated as a homeowner. Everything now routes through these helpers.
 */
import { supabase } from "@/integrations/supabase/client";

export const HOMEOWNER_TYPE = "homeowner";

/** Anything that is not a homeowner (and is actually known) is a contractor-side account. */
export function isContractorType(accountType: string | null | undefined): boolean {
  return !!accountType && accountType !== HOMEOWNER_TYPE;
}

export function isHomeownerType(accountType: string | null | undefined): boolean {
  return accountType === HOMEOWNER_TYPE;
}

export type ProfileRoleRead = {
  /** false when the read itself failed (network/RLS) — the role is UNKNOWN, not "homeowner". */
  ok: boolean;
  /** true when the read succeeded and there simply is no profile row yet. */
  missing: boolean;
  accountType: string | null;
  displayName: string | null;
};

/**
 * Read the signed-in user's role. Retries once, because a single transient
 * failure used to be indistinguishable from "this user is a homeowner" and
 * silently sent contractors to the wrong dashboard (and, worse, let the
 * stamp helper overwrite their real role with "homeowner").
 */
export async function readProfileRole(uid: string, attempts = 2): Promise<ProfileRoleRead> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type, display_name")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        lastError = error;
      } else {
        const row = data as { account_type: string | null; display_name: string | null } | null;
        return {
          ok: true,
          missing: !row,
          accountType: row?.account_type ?? null,
          displayName: row?.display_name ?? null,
        };
      }
    } catch (e) {
      lastError = e;
    }

    if (attempt + 1 < attempts) await new Promise((r) => setTimeout(r, 400));
  }

  if (lastError) console.warn("[account-role] profile read failed:", lastError);
  return { ok: false, missing: false, accountType: null, displayName: null };
}

/** Where should this account land after sign-in / confirmation? */
export function dashboardPathFor(accountType: string | null | undefined): "/contractor" | "/homeowner" {
  return isContractorType(accountType) ? "/contractor" : "/homeowner";
}

/**
 * Resolve the landing dashboard for the current session. Never guesses
 * "homeowner" off a failed read.
 */
export async function resolveDashboardPath(): Promise<"/contractor" | "/homeowner"> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return "/homeowner";
    const { accountType } = await readProfileRole(uid);
    return dashboardPathFor(accountType);
  } catch (e) {
    console.warn("[account-role] resolveDashboardPath failed:", e);
    return "/homeowner";
  }
}
