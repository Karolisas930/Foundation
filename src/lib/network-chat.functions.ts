import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertContractor(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_verified_contractor", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: verified contractor role required");
}

export const listNetworkThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertContractor(context);
    const { supabase, userId } = context;

    const { data: memberships, error: mErr } = await supabase
      .from("network_thread_members")
      .select("thread_id")
      .eq("user_id", userId);
    if (mErr) throw new Error(mErr.message);

    const threadIds = (memberships ?? []).map((m: any) => m.thread_id);
    if (!threadIds.length) return { threads: [] };

    const { data: threads, error: tErr } = await supabase
      .from("network_threads")
      .select("id, created_at, created_by")
      .in("id", threadIds)
      .order("created_at", { ascending: false });
    if (tErr) throw new Error(tErr.message);

    const { data: members } = await supabase
      .from("network_thread_members")
      .select("thread_id, user_id")
      .in("thread_id", threadIds);

    const otherIds = Array.from(
      new Set((members ?? []).map((m: any) => m.user_id).filter((id: string) => id !== userId)),
    );

    const { data: profiles } = otherIds.length
      ? await supabase
          .from("profiles")
          .select("id, display_name, full_name, city, avatar_url, trades")
          .in("id", otherIds)
      : { data: [] as any[] };
    const profById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const { data: lastMessages } = await supabase
      .from("network_messages")
      .select("thread_id, body, created_at, sender_id, read_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    const lastByThread = new Map<string, any>();
    for (const m of lastMessages ?? []) {
      if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    }

    return {
      threads: (threads ?? []).map((t: any) => {
        const peerId = (members ?? []).find(
          (m: any) => m.thread_id === t.id && m.user_id !== userId,
        )?.user_id;
        return {
          id: t.id,
          createdAt: t.created_at,
          peer: peerId ? (profById.get(peerId) ?? { id: peerId }) : null,
          lastMessage: lastByThread.get(t.id) ?? null,
        };
      }),
    };
  });

export const getNetworkThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertContractor(context);
    const { supabase, userId } = context;

    const { data: messages, error } = await supabase
      .from("network_messages")
      .select("id, thread_id, sender_id, body, read_at, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: members } = await supabase
      .from("network_thread_members")
      .select("user_id")
      .eq("thread_id", data.threadId);

    const peerIds = (members ?? [])
      .map((m: any) => m.user_id)
      .filter((id: string) => id !== userId);
    const { data: profiles } = peerIds.length
      ? await supabase
          .from("profiles")
          .select("id, display_name, full_name, city, avatar_url, trades")
          .in("id", peerIds)
      : { data: [] as any[] };

    return { messages: messages ?? [], peers: profiles ?? [] };
  });

export const searchContractors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { q?: string; city?: string; trade?: string }) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertContractor(context);
    const { supabase, userId } = context;

    // Discoverable = any profile with an account_type set that isn't a
    // homeowner (matches useUser.ts's isContractor + the SQL helper
    // is_verified_contractor). One query, no user_roles roundtrip.
    let query = supabase
      .from("profiles")
      .select("id, display_name, full_name, city, avatar_url, trades")
      .neq("id", userId)
      .not("account_type", "is", null)
      .neq("account_type", "homeowner")
      .limit(30);

    if (data.q && data.q.trim()) {
      const q = `%${data.q.trim()}%`;
      query = query.or(`display_name.ilike.${q},full_name.ilike.${q},city.ilike.${q}`);
    }
    if (data.city && data.city.trim()) query = query.ilike("city", `%${data.city.trim()}%`);
    if (data.trade && data.trade.trim()) query = query.contains("trades", [data.trade.trim()]);

    const { data: results, error } = await query;
    if (error) throw new Error(error.message);
    return { results: results ?? [] };
  });

export const startNetworkThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { peerUserId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertContractor(context);
    const { supabase, userId } = context;
    if (data.peerUserId === userId) throw new Error("Cannot message yourself");

    const { data: peerCheck } = await supabase.rpc("is_verified_contractor", {
      _user_id: data.peerUserId,
    });
    if (!peerCheck) throw new Error("Peer is not a verified contractor");

    // Look for existing 1:1 thread
    const { data: myThreads } = await supabase
      .from("network_thread_members")
      .select("thread_id")
      .eq("user_id", userId);
    const myIds = (myThreads ?? []).map((r: any) => r.thread_id);
    if (myIds.length) {
      const { data: shared } = await supabase
        .from("network_thread_members")
        .select("thread_id")
        .eq("user_id", data.peerUserId)
        .in("thread_id", myIds);
      const existing = (shared ?? [])[0];
      if (existing) return { threadId: existing.thread_id };
    }

    const { data: created, error: cErr } = await supabase
      .from("network_threads")
      .insert({ created_by: userId })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    const { error: mErr } = await supabase.from("network_thread_members").insert([
      { thread_id: created.id, user_id: userId },
      { thread_id: created.id, user_id: data.peerUserId },
    ]);
    if (mErr) throw new Error(mErr.message);

    return { threadId: created.id };
  });

export const sendNetworkMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId: string; body: string }) => data)
  .handler(async ({ data, context }) => {
    await assertContractor(context);
    const body = data.body?.trim();
    if (!body) throw new Error("Message body required");
    const { supabase, userId } = context;
    const { data: inserted, error } = await supabase
      .from("network_messages")
      .insert({ thread_id: data.threadId, sender_id: userId, body, channel_type: "network" })
      .select("id, thread_id, sender_id, body, read_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { message: inserted };
  });

export const markNetworkThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertContractor(context);
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("network_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", data.threadId)
      .neq("sender_id", userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyContractorStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_verified_contractor", {
      _user_id: context.userId,
    });
    return { isVerifiedContractor: Boolean(data) };
  });
