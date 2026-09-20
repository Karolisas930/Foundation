// @ts-nocheck
/**
 * Privacy Serializer Gate - server functions.
 *
 * Contact fields (website_url, instagram_handle, phone_e164) live on
 * `public.profiles`, which has an owner-only RLS SELECT policy. No client
 * can read another user's row via the Data API - they always come through
 * these server functions, which decide whether to include or strip the
 * contact fields based on whether an unlocked match exists between
 * the viewer and the profile owner.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createServerPublicClient } from "@/integrations/supabase/server-public-client";

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
  contact: ContactBlock | null;
  matchId: string | null;
  matchStatus: string | null;
  isOwner: boolean;
};

const idSchema = z.object({ profileId: z.string().uuid() });

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().positive().max(50).optional(),
});

function createPublicClient() {
  return createServerPublicClient();
}

/**
 * PUBLIC (unauth) - safe columns only. Anyone can browse public profile card
 * data. Never returns contact fields.
 */
export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const supabase = createPublicClient();
    const result = await supabase.rpc("get_public_profile", {
      _profile_id: data.profileId,
    });
    if (result.error) throw result.error;
    const row = result.data ? result.data[0] : null;
    return row ? (row as PublicProfile) : null;
  });

/**
 * AUTH'D - returns the safe public block plus (if an unlocked match exists
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

    const matchLookup = await context.supabase
      .from("matches")
      .select("id, status, contractor_id, client_id")
      .eq("contractor_id", contractorId)
      .eq("client_id", viewerId)
      .maybeSingle();
    const match = matchLookup.data;

    const unlocked = isOwner || (match && match.status === "unlocked");

    if (unlocked) {
      const adminModule = await import("@/integrations/supabase/client.server");
      const supabaseAdmin = adminModule.supabaseAdmin;
      const fullResult = await supabaseAdmin
        .from("profiles")
        .select(
          "id, company_name, display_name, full_name, trades, city, bio, website_url, instagram_handle, phone, created_at",
        )
        .eq("id", contractorId)
        .maybeSingle();
      if (fullResult.error) throw fullResult.error;
      const full = fullResult.data;
      if (!full) {
        return {
          profile: null,
          unlocked: false,
          contact: null,
          matchId: match ? match.id : null,
          matchStatus: match ? match.status : null,
          isOwner: isOwner,
        };
      }
      const businessName = full.company_name || full.display_name || full.full_name || null;
      const tradeLabel =
        full.trades && full.trades.length > 0 ? full.trades.join(", ") : null;
      return {
        profile: {
          id: full.id,
          business_name: businessName,
          trade: tradeLabel,
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
        matchId: match ? match.id : null,
        matchStatus: match ? match.status : "unlocked",
        isOwner: isOwner,
      };
    }

    const publicSb = createPublicClient();
    const rpcResult = await publicSb.rpc("get_public_profile", {
      _profile_id: contractorId,
    });
    if (rpcResult.error) throw rpcResult.error;
    const row = rpcResult.data ? (rpcResult.data[0] as PublicProfile | undefined) : undefined;

    return {
      profile: row || null,
      unlocked: false,
      contact: null,
      matchId: match ? match.id : null,
      matchStatus: match ? match.status : null,
      isOwner: isOwner,
    };
  });

/**
 * PUBLIC (unauth) - safe columns only, for many profiles at once. Backs the
 * homeowner "Find a Tradesperson" browse page. Optional free-text search
 * matches city, business name, or trade.
 */
export const listPublicProfiles = createServerFn({ method: "GET" })
  .validator((data: unknown) => listSchema.parse(data || {}))
  .handler(async ({ data }): Promise<PublicProfile[]> => {
    const supabase = createPublicClient();
    const result = await supabase.rpc("list_public_profiles", {
      _search: data.search || null,
      _limit: data.limit || 24,
    });
    if (result.error) throw result.error;
    return (result.data || []) as PublicProfile[];
  });

/**
 * AUTH'D - create (or fetch) a pending match between the signed-in client and
 * the target contractor. Idempotent on the (contractor, client) pair.
 */
export const requestMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ contractorId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.contractorId === context.userId) {
      throw new Error("You cannot request a match with yourself.");
    }
    const existing = await context.supabase
      .from("matches")
      .select("id, status")
      .eq("contractor_id", data.contractorId)
      .eq("client_id", context.userId)
      .maybeSingle();
    if (existing.data) return existing.data;

    const inserted = await context.supabase
      .from("matches")
      .insert({ contractor_id: data.contractorId, client_id: context.userId })
      .select("id, status")
      .single();
    if (inserted.error) throw inserted.error;
    return inserted.data;
  });

/**
 * AUTH'D - the signed-in user accepts a match they are a party to.
 * Uses service role to bypass the deliberately-missing UPDATE policy on
 * public.matches (defense-in-depth: the client cannot flip status via Data
 * API - only through this authorized server function).
 * When both parties have accepted, the DB trigger flips status to 'unlocked'.
 */
export const acceptMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ matchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const matchLookup = await context.supabase
      .from("matches")
      .select("id, contractor_id, client_id, status")
      .eq("id", data.matchId)
      .maybeSingle();
    if (matchLookup.error) throw matchLookup.error;
    const match = matchLookup.data;
    if (!match) throw new Error("Match not found or not visible.");

    const role = match.contractor_id === context.userId ? "contractor" : "client";

    const adminModule = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = adminModule.supabaseAdmin;
    const patch =
      role === "contractor"
        ? { contractor_accepted_at: new Date().toISOString() }
        : { client_accepted_at: new Date().toISOString() };

    const updateResult = await supabaseAdmin
      .from("matches")
      .update(patch)
      .eq("id", data.matchId)
      .select("id, status, client_accepted_at, contractor_accepted_at, unlocked_at")
      .single();
    if (updateResult.error) throw updateResult.error;
    return updateResult.data;
  });
