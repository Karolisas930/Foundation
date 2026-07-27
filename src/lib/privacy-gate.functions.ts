// @ts-nocheck
/**
 * Privacy Serializer Gate — server functions.
 *
 * Contact fields (website_url, instagram_handle, phone_e164) live on
 * `public.profiles`, which has an owner-only RLS SELECT policy. No client
 * can read another user's row via the Data API — they always come through
 * these server functions, which decide whether to include or strip the
 * contact fields based on whether an *unlocked* match exists between
 * the viewer and the profile owner.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicProfile = {
  id: string;
  business_name: string | null;
  trade: string | null;
  city: string | null;
  bio: string | null;
  created_at: string;
};

export type ContactBlock = {
  website_url: string | null;
  instagram_handle: string | null;
  phone_e164: string | null;
};

export type ViewerProfileResult = {
  profile: PublicProfile | null;
  unlocked: boolean;
  contact: ContactBlock | null; // null unless unlocked
  matchId: string | null;
  matchStatus: string | null;
  isOwner: boolean;
};

const idSchema = z.object({ profileId: z.string().uuid() });

/**
 * PUBLIC (unauth) — safe columns only. Anyone can browse public profile card
 * data. Never returns contact fields.
 */
export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    // get_public_profile is SECURITY DEFINER and returns only safe columns.
    const { data: rows, error } = await supabase.rpc("get_public_profile", {
      _profile_id: data.profileId,
    });
    if (error) throw error;
    const row = rows?.[0];
    return row ? (row as PublicProfile) : null;
  });

/**
 * AUTH'D — returns the safe public block plus (if an unlocked match exists
 * between the viewer and the target profile) the sensitive contact block.
 * Also returns match state so the UI can render the correct CTA.
 */
export const getProfileForViewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }): Promise<ViewerProfileResult> => {
    const viewerId = context.userId;
    const contractorId = data.profileId;
    const isOwner = viewerId === contractorId;

    // Look up the pairing (viewer as client of the profile owner as contractor).
    const { data: match } = await context.supabase
      .from("matches")
      .select("id, status, contractor_id, client_id")
      .eq("contractor_id", contractorId)
      .eq("client_id", viewerId)
      .maybeSingle();

    const unlocked = isOwner || match?.status === "unlocked";

    if (unlocked) {
      // Read full profile via service role (owner-only RLS blocks direct auth reads).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: full, error } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, company_name, display_name, full_name, trades, city, bio, website_url, instagram_handle, phone, created_at",
        )
        .eq("id", contractorId)
        .maybeSingle();
      if (error) throw error;
      if (!full) {
        return {
          profile: null,
          unlocked: false,
          contact: null,
          matchId: match?.id ?? null,
          matchStatus: match?.status ?? null,
          isOwner,
        };
      }
      return {
        profile: {
          id: full.id,
          business_name: full.company_name ?? full.display_name ?? full.full_name ?? null,
          trade: full.trades?.length ? full.trades.join(", ") : null,
          city: full.city,
          bio: full.bio,
          created_at: full.created_at,
        },
        unlocked: true,
        contact: {
          website_url: full.website_url,
          instagram_handle: full.instagram_handle,
          phone_e164: full.phone,
        },
        matchId: match?.id ?? null,
        matchStatus: match?.status ?? "unlocked",
        isOwner,
      };
    }

    // Not unlocked — safe columns only.
    const publicSb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await publicSb.rpc("get_public_profile", {
      _profile_id: contractorId,
    });
    if (error) throw error;
    const row = rows?.[0] as PublicProfile | undefined;

    return {
      profile: row ?? null,
      unlocked: false,
      contact: null,
      matchId: match?.id ?? null,
      matchStatus: match?.status ?? null,
      isOwner,
    };
  });

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().positive().max(50).optional(),
});

/**
 * PUBLIC (unauth) — safe columns only, for many profiles at once. Backs the
 * homeowner "Find a Tradesperson" browse page. Optional free-text `search`
 * matches city, business name, or trade.
 */
export const listPublicProfiles = createServerFn({ method: "GET" })
  .validator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<PublicProfile[]> => {
    const supabase = createClient
