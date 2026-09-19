/**
 * Project chat — a homeowner messaging a contractor who bid on their project
 * (and vice versa) *before* any booking exists.
 *
 * Messages live in `public.messages` with the new `job_id` column, so the
 * thread is scoped to one project + one peer. The pairing is validated by the
 * SECURITY DEFINER helper `public.job_chat_peer()`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export interface ProjectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ProjectThread {
  jobId: string;
  peerId: string;
  peerName: string;
  peerCity: string | null;
  messages: ProjectMessage[];
}

const threadInput = z.object({ jobId: z.string().uuid(), peerId: z.string().uuid() });

async function assertPeer(
  supabase: unknown,
  jobId: string,
  peerId: string,
): Promise<{ peerName: string; peerCity: string | null }> {
  const { data, error } = await untyped(supabase).rpc("job_chat_peer", {
    _job_id: jobId,
    _peer_id: peerId,
  });
  if (error) throw new Error(error.message);
  const row = ((data ?? []) as Record<string, unknown>[])[0];
  return {
    peerName: (row?.peer_name as string | null) ?? "User",
    peerCity: (row?.peer_city as string | null) ?? null,
  };
}

/** Full history for one project + peer pairing. */
export const getProjectThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => threadInput.parse(data))
  .handler(async ({ context, data }): Promise<ProjectThread> => {
    const { supabase, userId } = context;
    const peer = await assertPeer(supabase, data.jobId, data.peerId);

    const { data: rows, error } = await untyped(supabase)
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .eq("job_id", data.jobId)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${data.peerId}),and(sender_id.eq.${data.peerId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return {
      jobId: data.jobId,
      peerId: data.peerId,
      peerName: peer.peerName,
      peerCity: peer.peerCity,
      messages: ((rows ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        senderId: String(r.sender_id),
        recipientId: String(r.recipient_id),
        body: String(r.body ?? ""),
        createdAt: String(r.created_at),
        mine: String(r.sender_id) === userId,
      })),
    };
  });

/** Send one message on a project thread. */
export const sendProjectMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    threadInput.extend({ body: z.string().trim().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<{ message: ProjectMessage }> => {
    const { supabase, userId } = context;
    await assertPeer(supabase, data.jobId, data.peerId);

    const { data: row, error } = await untyped(supabase)
      .from("messages")
      .insert({
        job_id: data.jobId,
        sender_id: userId,
        recipient_id: data.peerId,
        body: data.body,
      })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Best-effort notification; never blocks the message.
    try {
      await untyped(supabase)
        .from("notifications")
        .insert({
          recipient_id: data.peerId,
          sender_id: userId,
          type: "message_sent",
          message: data.body.slice(0, 240),
          metadata: { job_id: data.jobId },
        });
    } catch (err) {
      console.warn("[sendProjectMessage] notification insert failed:", err);
    }

    const r = row as Record<string, unknown>;
    return {
      message: {
        id: String(r.id),
        senderId: String(r.sender_id),
        recipientId: String(r.recipient_id),
        body: String(r.body ?? ""),
        createdAt: String(r.created_at),
        mine: true,
      },
    };
  });
