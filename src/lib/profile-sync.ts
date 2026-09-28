/**
 * Single write path for onboarding → public.profiles.
 *
 * public.profiles is the source of truth for display_name, phone,
 * account_type and trades. auth.users metadata only receives a lightweight
 * hint (account_type + display_name) so role routing works before the
 * profile row is readable.
 */
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";

export type AccountType = "homeowner" | "handyman" | "business" | "architect";

export interface ProfileFields {
  accountType: AccountType;
  displayName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  trades?: string[] | null;
  languages?: string[] | null;
  postalCode?: string | null;
  city?: string | null;
  addressLine1?: string | null;
  bio?: string | null;
  serviceRadiusKm?: number | null;
  minProjectSize?: number | null;
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t ? t : undefined;
};

/** Row for profiles.upsert — undefined keys are omitted so existing values stay. */
export function toProfileRow(uid: string, f: ProfileFields) {
  const row: Record<string, unknown> = { id: uid, account_type: f.accountType };
  const set = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) row[k] = v;
  };
  set("display_name", clean(f.displayName) ?? clean(f.companyName) ?? clean(f.fullName));
  set("full_name", clean(f.fullName));
  set("phone", clean(f.phone));
  set("company_name", clean(f.companyName));
  set("trades", f.trades?.map((t) => t.trim()).filter(Boolean));
  set("languages", f.languages?.filter(Boolean));
  set("postal_code", clean(f.postalCode));
  set("city", clean(f.city));
  set("address_line1", clean(f.addressLine1));
  set("bio", clean(f.bio));
  set("service_radius_km", f.serviceRadiusKm);
  set("min_project_size", f.minProjectSize);
  return row;
}

/** Lightweight auth metadata only — no phone, trades or bio. */
export function toAuthMetadata(f: ProfileFields) {
  return {
    account_type: f.accountType,
    display_name: clean(f.displayName) ?? clean(f.companyName) ?? clean(f.fullName),
  };
}

/** Save onto a given user id. Returns an error message or undefined. */
export async function saveProfileFields(uid: string, f: ProfileFields): Promise<string | undefined> {
  const { error } = await supabase
    .from("profiles")
    .upsert(toProfileRow(uid, f) as never, { onConflict: "id" });
  if (error) return error.message;
  try {
    await supabase.auth.updateUser({ data: toAuthMetadata(f) });
  } catch {
    /* metadata hint is best effort */
  }
  return undefined;
}

/** Save for whoever is signed in right now; no-op when signed out. */
export async function saveProfileForCurrentUser(f: ProfileFields): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return undefined;
    return await saveProfileFields(uid, f);
  } catch (e) {
    return e instanceof Error ? e.message : "Profile save failed";
  }
}
