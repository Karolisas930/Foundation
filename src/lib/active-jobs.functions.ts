/**
 * Contractor active jobs — real Supabase data.
 *
 * Reads confirmed bookings awarded to the signed-in contractor through the
 * SECURITY DEFINER helper `public.my_active_jobs()`, so job titles stay
 * readable after a job leaves the public feed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export interface ActiveJob {
  bookingId: string;
  jobId: string | null;
  matchId: string | null;
  status: string;
  agreedPriceCents: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  title: string;
  city: string | null;
  zip: string | null;
  trade: string | null;
  clientId: string;
  clientName: string;
}

/** Every booking awarded to me, newest first. */
export const listMyActiveJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ jobs: ActiveJob[] }> => {
    const { data, error } = await untyped(context.supabase).rpc("my_active_jobs");
    if (error) throw new Error(error.message);
    return {
      jobs: ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        bookingId: String(r.booking_id),
        jobId: (r.job_id as string | null) ?? null,
        matchId: (r.match_id as string | null) ?? null,
        status: String(r.status ?? "confirmed"),
        agreedPriceCents: Number(r.agreed_price_cents ?? 0),
        scheduledStart: (r.scheduled_start as string | null) ?? null,
        scheduledEnd: (r.scheduled_end as string | null) ?? null,
        completedAt: (r.completed_at as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
        createdAt: String(r.created_at),
        title: (r.job_title as string | null) ?? "Job",
        city: (r.job_city as string | null) ?? null,
        zip: (r.job_zip as string | null) ?? null,
        trade: (r.job_trade as string | null) ?? null,
        clientId: String(r.client_id),
        clientName: (r.client_name as string | null) ?? "Client",
      })),
    };
  });

/** Update scheduling / status / notes on one of my bookings. */
export const updateMyActiveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        bookingId: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]).optional(),
        scheduledStart: z.string().optional().nullable(),
        scheduledEnd: z.string().optional().nullable(),
        notes: z.string().trim().max(4000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    if (data.scheduledStart !== undefined) patch.scheduled_start = data.scheduledStart || null;
    if (data.scheduledEnd !== undefined) patch.scheduled_end = data.scheduledEnd || null;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await untyped(supabase)
      .from("bookings")
      .update(patch)
      .eq("id", data.bookingId)
      .eq("provider_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
