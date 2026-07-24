/**
 * Phase 4 — Client ↔ Contractor messaging.
 *
 * Threads are keyed by a row in `public.matches`. A thread is only usable
 * once `match_unlocked = true` (privacy gate — Phase 3). Messages are
 * stored in `public.messages` with the pair (sender_id, recipient_id) set
 * to the two participants of the match. RLS on `messages` already restricts
 * SELECT/INSERT to the participants.
 *
 * These functions work identically for the client-side view (homeowner
 * seeing their contractors) and the contractor-side view (contractor
 * seeing their unlocked clients), because a `matches` row lists both
 * `client_id` and `contractor_id` and we always project the *other* party
 * as the "peer".
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type MatchRow = {
  id: string;
  client_id: string;
  contractor_id: string;
  match_unlocked: boolean;
  updated_at: string;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** List every unlocked match the current user is part of, with peer + last message. */
export const listClientThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: matchesRaw, error: mErr } = await supabase
      .from("matches")
      .select("id, client_id, contractor_id, match_unlocked, updated_at")
      .or(`client_id.eq.${userId},contractor_id.eq.${userId}`)
      .eq("match_unlocked", true)
      .order("updated_at", { ascending: false });
    if (mErr) throw new Error(mErr.message);

    const matches = (matchesRaw ?? []) as MatchRow[];
    if (!matches.length) return { threads: [] };

    const peerIds = Array.from(
      new Set(matches.map((m) => (m.client_id === userId ? m.contractor_id : m.client_id))),
    );

    const { data: profilesRaw } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, avatar_url, city")
      .in("id", peerIds);
    const profileById = new Map(((profilesRaw ?? []) as ProfileLite[]).map((p) => [p.id, p]));

    // Fetch recent messages for each pair. Cheap approach: one query per
    // match id set — pull last N messages where the current user is party
    // and the peer is the other, then reduce.
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(500);

    const lastByPeer = new Map<string, MessageRow>();
    const unreadByPeer = new Map<string, number>();
    for (const m of (msgs ?? []) as MessageRow[]) {
      const peerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!lastByPeer.has(peerId)) lastByPeer.set(peerId, m);
      if (m.recipient_id === userId && !m.read_at) {
        unreadByPeer.set(peerId, (unreadByPeer.get(peerId) ?? 0) + 1);
      }
    }

    return {
      threads: matches.map((m) => {
        const peerId = m.client_id === userId ? m.contractor_id : m.client_id;
        const peer = profileById.get(peerId) ?? null;
        const last = lastByPeer.get(peerId) ?? null;
        return {
          matchId: m.id,
          peerId,
          peer,
          role: m.client_id === userId ? ("client" as const) : ("contractor" as const),
          lastMessage: last,
          unread: unreadByPeer.get(peerId) ?? 0,
          updatedAt: last?.created_at ?? m.updated_at,
        };
      }),
    };
  });

/** Load full message history for one match (participants only via RLS). */
export const getClientThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { matchId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: matchRaw, error: mErr } = await supabase
      .from("matches")
      .select("id, client_id, contractor_id, match_unlocked")
      .eq("id", data.matchId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    const match = matchRaw as MatchRow | null;
    if (!match) throw new Error("Match not found");
    if (match.client_id !== userId && match.contractor_id !== userId) {
      throw new Error("Forbidden");
    }
    if (!match.match_unlocked) throw new Error("Match not unlocked");

    const peerId = match.client_id === userId ? match.contractor_id : match.client_id;

    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    const { data: peer } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, avatar_url, city")
      .eq("id", peerId)
      .maybeSingle();

    return {
      matchId: match.id,
      peerId,
      peer: (peer as ProfileLite | null) ?? null,
      messages: (msgs ?? []) as MessageRow[],
    };
  });

/** Send a text message on an unlocked match. Returns the inserted row. */
export const sendClientMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { matchId: string; body: string }) => {
    if (!data?.matchId) throw new Error("matchId required");
    const body = (data.body ?? "").trim();
    if (!body) throw new Error("Message body required");
    if (body.length > 4000) throw new Error("Message too long");
    return { matchId: data.matchId, body };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: matchRaw, error: mErr } = await supabase
      .from("matches")
      .select("id, client_id, contractor_id, match_unlocked")
      .eq("id", data.matchId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    const match = matchRaw as MatchRow | null;
    if (!match) throw new Error("Match not found");
    if (match.client_id !== userId && match.contractor_id !== userId) {
      throw new Error("Forbidden");
    }
    if (!match.match_unlocked) throw new Error("Match not unlocked");

    const recipientId = match.client_id === userId ? match.contractor_id : match.client_id;

    const { data: inserted, error: iErr } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        recipient_id: recipientId,
        body: data.body,
      })
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .single();
    if (iErr) throw new Error(iErr.message);

    // Bump the match so listClientThreads sorts it to the top.
    await supabase
      .from("matches")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", match.id);

    return { message: inserted as MessageRow };
  });

/** Mark every incoming message from the peer of this match as read. */
export const markClientThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { matchId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: matchRaw } = await supabase
      .from("matches")
      .select("id, client_id, contractor_id")
      .eq("id", data.matchId)
      .maybeSingle();
    const match = matchRaw as MatchRow | null;
    if (!match) return { updated: 0 };
    if (match.client_id !== userId && match.contractor_id !== userId) {
      throw new Error("Forbidden");
    }
    const peerId = match.client_id === userId ? match.contractor_id : match.client_id;

    const { data: updated, error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", peerId)
      .eq("recipient_id", userId)
      .is("read_at", null)
      .select("id");
    if (error) throw new Error(error.message);
    return { updated: (updated ?? []).length };
  });
