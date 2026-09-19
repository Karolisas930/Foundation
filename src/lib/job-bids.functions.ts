/**
 * Bids / quotes on a project — real Supabase data (`public.job_bids`).
 *
 * Replaces the per-browser demo stores that used to power the contractor
 * "Quotes" page and the homeowner bid list. Cross-role reads go through the
 * SECURITY DEFINER helpers created in
 * db/manual-migrations/20260918093000_bid_details_and_active_jobs.sql.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export const BID_STATUSES = ["draft", "sent", "accepted", "declined", "withdrawn"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

/** A bid as the bidding contractor sees it (their Quotes list). */
export interface MyBid {
  id: string;
  jobId: string;
  laborCents: number;
  materialsCents: number;
  travelCents: number;
  message: string | null;
  timelineDays: number | null;
  validUntil: string | null;
  status: BidStatus;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  jobCity: string | null;
  jobZip: string | null;
  jobTrade: string | null;
  jobStatus: string;
  jobBudget: number;
  ownerId: string;
  ownerName: string;
}

/** A bid as the homeowner sees it on their own project. */
export interface ProjectBid {
  id: string;
  jobId: string;
  contractorId: string;
  laborCents: number;
  materialsCents: number;
  travelCents: number;
  message: string | null;
  timelineDays: number | null;
  validUntil: string | null;
  status: BidStatus;
  sentAt: string | null;
  createdAt: string;
  contractorName: string;
  contractorCity: string | null;
  contractorAvatarUrl: string | null;
}

function asStatus(value: unknown): BidStatus {
  return (BID_STATUSES as readonly string[]).includes(String(value))
    ? (value as BidStatus)
    : "draft";
}

/* ------------------------------------------------------------ contractor */

/** Every bid the signed-in contractor has placed, newest first. */
export const listMyBids = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ bids: MyBid[] }> => {
    const { data, error } = await untyped(context.supabase).rpc("my_job_bids");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    return {
      bids: rows.map((r) => ({
        id: String(r.id),
        jobId: String(r.job_id),
        laborCents: Number(r.labor_cents ?? 0),
        materialsCents: Number(r.materials_cents ?? 0),
        travelCents: Number(r.travel_cents ?? 0),
        message: (r.message as string | null) ?? null,
        timelineDays: (r.timeline_days as number | null) ?? null,
        validUntil: (r.valid_until as string | null) ?? null,
        status: asStatus(r.status),
        sentAt: (r.sent_at as string | null) ?? null,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at ?? r.created_at),
        jobTitle: (r.job_title as string | null) ?? "Project",
        jobCity: (r.job_city as string | null) ?? null,
        jobZip: (r.job_zip as string | null) ?? null,
        jobTrade: (r.job_trade as string | null) ?? null,
        jobStatus: String(r.job_status ?? "open"),
        jobBudget: Number(r.job_budget ?? 0),
        ownerId: String(r.owner_id),
        ownerName: (r.owner_name as string | null) ?? "Client",
      })),
    };
  });

const bidInput = z.object({
  id: z.string().uuid().optional(),
  jobId: z.string().uuid(),
  laborCents: z.number().int().min(0).max(100_000_000).default(0),
  materialsCents: z.number().int().min(0).max(100_000_000).default(0),
  travelCents: z.number().int().min(0).max(100_000_000).default(0),
  message: z.string().trim().max(4000).optional().nullable(),
  timelineDays: z.number().int().min(0).max(3650).optional().nullable(),
  validUntil: z.string().trim().max(10).optional().nullable(),
  /** "draft" keeps it private; "sent" makes it visible to the homeowner. */
  status: z.enum(["draft", "sent"]).default("draft"),
});

export type BidInput = z.input<typeof bidInput>;

/** Create or update one of my bids (upsert on job + contractor). */
export const saveMyBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => bidInput.parse(data))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { supabase, userId } = context;

    const payload: Record<string, unknown> = {
      job_id: data.jobId,
      contractor_id: userId,
      labor_cents: data.laborCents ?? 0,
      materials_cents: data.materialsCents ?? 0,
      travel_cents: data.travelCents ?? 0,
      message: data.message ?? null,
      timeline_days: data.timelineDays ?? null,
      valid_until: data.validUntil || null,
      status: data.status ?? "draft",
      sent_at: data.status === "sent" ? new Date().toISOString() : null,
    };

    const query = data.id
      ? untyped(supabase)
          .from("job_bids")
          .update(payload)
          .eq("id", data.id)
          .eq("contractor_id", userId)
          .select("id")
          .single()
      : untyped(supabase)
          .from("job_bids")
          .upsert(payload, { onConflict: "job_id,contractor_id" })
          .select("id")
          .single();

    const { data: row, error } = await query;
    if (error) throw new Error(error.message);
    return { id: String((row as { id: string }).id) };
  });

/** Send a draft bid, or withdraw one I already sent. */
export const setMyBidStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["draft", "sent", "withdrawn"]) })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await untyped(supabase)
      .from("job_bids")
      .update({
        status: data.status,
        sent_at: data.status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("contractor_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Permanently delete one of my draft bids. */
export const deleteMyBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await untyped(supabase)
      .from("job_bids")
      .delete()
      .eq("id", data.id)
      .eq("contractor_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------- homeowner */

/** Every bid placed on one of my projects, with the bidder's identity. */
export const listBidsForMyProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ jobId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ bids: ProjectBid[] }> => {
    const { data: rows, error } = await untyped(context.supabase).rpc("job_bid_details", {
      _job_id: data.jobId,
    });
    if (error) throw new Error(error.message);
    return {
      bids: ((rows ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        jobId: String(r.job_id),
        contractorId: String(r.contractor_id),
        laborCents: Number(r.labor_cents ?? 0),
        materialsCents: Number(r.materials_cents ?? 0),
        travelCents: Number(r.travel_cents ?? 0),
        message: (r.message as string | null) ?? null,
        timelineDays: (r.timeline_days as number | null) ?? null,
        validUntil: (r.valid_until as string | null) ?? null,
        status: asStatus(r.status),
        sentAt: (r.sent_at as string | null) ?? null,
        createdAt: String(r.created_at),
        contractorName: (r.contractor_name as string | null) ?? "Contractor",
        contractorCity: (r.contractor_city as string | null) ?? null,
        contractorAvatarUrl: (r.contractor_avatar_url as string | null) ?? null,
      })),
    };
  });

/** Award the project to one bid (declines the rest + creates match/booking). */
export const acceptProjectBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ bidId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase).rpc("accept_job_bid", {
      _bid_id: data.bidId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Decline a single bid without awarding the project. */
export const declineProjectBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ bidId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase)
      .from("job_bids")
      .update({ status: "declined", decided_at: new Date().toISOString() })
      .eq("id", data.bidId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Reverse an accepted bid: re-opens the project, declines the bid and
 * cancels the match/booking (see 20260918110000_cancel_job_award.sql).
 */
export const cancelProjectAward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ bidId: z.string().uuid(), reason: z.string().trim().min(10).max(1000) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase).rpc("cancel_job_award", {
      _bid_id: data.bidId,
      _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
