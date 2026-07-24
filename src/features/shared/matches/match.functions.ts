// @ts-nocheck
/**
 * Pillar 2: Matching Engine — server functions.
 *
 * Wraps the `match_job_to_worker` Postgres function which computes a
 * 0-100 score from budget (35) + sector (30) + distance (25) + urgency (10).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const scoreSchema = z.object({
  jobId: z.string().uuid(),
  workerId: z.string().uuid(),
});

export type MatchScore = {
  score: number;
  budget_score: number;
  sector_score: number;
  distance_score: number;
  urgency_score: number;
  distance_km: number | null;
  breakdown: Json;
};

function toBreakdown(v: unknown): Json {
  if (v === null || v === undefined) return {};
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  return v as Json;
}

/** Compute the score for a job/worker pair (does not persist). */
export const scoreJobWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => scoreSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("match_job_to_worker", {
      _job_id: data.jobId,
      _worker_id: data.workerId,
    });
    if (error) throw error;
    const row = Array.isArray(rows) ? rows[0] : rows;
    const result: MatchScore = {
      score: row?.score ?? 0,
      budget_score: row?.budget_score ?? 0,
      sector_score: row?.sector_score ?? 0,
      distance_score: row?.distance_score ?? 0,
      urgency_score: row?.urgency_score ?? 0,
      distance_km: row?.distance_km ?? null,
      breakdown: toBreakdown(row?.breakdown),
    };
    return result;
  });

const createSchema = z.object({
  jobId: z.string().uuid(),
  workerId: z.string().uuid(),
});

/**
 * Compute score AND upsert a match row (as the signed-in party — must be
 * either the job owner (client) or the worker (contractor)).
 */
export const createScoredMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: job, error: jobErr } = await context.supabase
      .from("jobs")
      .select("id, owner_id")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobErr) throw jobErr;
    if (!job) throw new Error("Job not found");

    const uid = context.userId;
    const clientId = job.owner_id;
    const contractorId = data.workerId;
    if (uid !== clientId && uid !== contractorId) {
      throw new Error("Only the job owner or the worker can create this match");
    }

    const { data: scoreRows, error: scoreErr } = await context.supabase.rpc("match_job_to_worker", {
      _job_id: data.jobId,
      _worker_id: data.workerId,
    });
    if (scoreErr) throw scoreErr;
    const s = (Array.isArray(scoreRows) ? scoreRows[0] : scoreRows) ?? {
      score: 0,
      breakdown: {},
    };

    const { data: match, error: insErr } = await context.supabase
      .from("matches")
      .upsert(
        {
          job_id: data.jobId,
          contractor_id: contractorId,
          client_id: clientId,
          match_score: s.score ?? 0,
          score_breakdown: toBreakdown(s.breakdown),
        },
        { onConflict: "contractor_id,client_id,job_id" },
      )
      .select()
      .single();
    if (insErr) throw insErr;
    return {
      matchId: match?.id ?? null,
      score: s.score ?? 0,
      breakdown: toBreakdown(s.breakdown),
    };
  });

/* ─────────────────────────────────────────────────────────────
 * Quote hook: log a `quote_sent` notification for the recipient.
 * ──────────────────────────────────────────────────────────── */

const sendQuoteSchema = z.object({
  matchId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  amountCents: z.number().int().nonnegative().optional(),
  channel: z.enum(["voice", "text"]).default("text"),
});

export type SendQuoteResult = {
  notificationId: string;
  recipientId: string;
};

/**
 * Called when a contractor sends a quote (voice or text) on a match.
 * Verifies the caller is the contractor of the match, then inserts a
 * `quote_sent` notification row for the client. No raw contact
 * credentials (phone/email) are copied into the payload — only the
 * caller-supplied message snippet + safe metadata.
 */
export const sendQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sendQuoteSchema.parse(data))
  .handler(async ({ data, context }): Promise<SendQuoteResult> => {
    const { data: match, error: matchErr } = await context.supabase
      .from("matches")
      .select("id, client_id, contractor_id")
      .eq("id", data.matchId)
      .maybeSingle();
    if (matchErr) throw matchErr;
    if (!match) throw new Error("Match not found");
    if (match.contractor_id !== context.userId) {
      throw new Error("Only the contractor can send a quote on this match");
    }

    const snippet = data.message.slice(0, 240);
    const metadata: Json = {
      channel: data.channel,
      ...(typeof data.amountCents === "number" ? { amount_cents: data.amountCents } : {}),
    };

    const insertRow = {
      recipient_id: match.client_id,
      sender_id: context.userId,
      match_id: match.id,
      type: "quote_sent",
      message: snippet,
      metadata,
    };

    const { data: notif, error: insErr } = await context.supabase
      .from("notifications")
      .insert(insertRow)
      .select("id, recipient_id")
      .single();
    if (insErr) throw new Error(insErr.message);
    if (!notif) throw new Error("Failed to create notification");

    return {
      notificationId: notif.id,
      recipientId: notif.recipient_id,
    };
  });
