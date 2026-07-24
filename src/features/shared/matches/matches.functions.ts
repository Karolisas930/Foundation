/**
 * Match-Unlocked Contact Reveal — server functions.
 *
 * Flow:
 *   1. Contractor calls `acceptJobMatch({ jobId })` → inserts a match row
 *      (status='accepted'). Client is derived from jobs.owner_id by the
 *      DB trigger; contractor cannot spoof it.
 *   2. Client calls `confirmMatch({ matchId })` → sets match_unlocked=true.
 *      The DB trigger enforces that only the job owner (client) may do this
 *      and only after the contractor has accepted.
 *   3. Either party calls `getMatchContact({ matchId })` → returns
 *      counterparty phone / email / address ONLY when match_unlocked=true.
 *      Backed by the SECURITY DEFINER function `public.get_match_contact`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MatchRow {
  id: string;
  jobId: string;
  clientId: string;
  contractorId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  matchUnlocked: boolean;
  acceptedAt: string | null;
  unlockedAt: string | null;
  createdAt: string;
}

export interface MatchContact {
  matchId: string;
  counterpartyId: string;
  fullName: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export interface MatchBankDetails {
  matchId: string;
  contractorId: string;
  companyName: string | null;
  accountHolder: string | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
}

function toRow(r: {
  id: string;
  job_id: string;
  client_id: string;
  contractor_id: string;
  status: MatchRow["status"];
  match_unlocked: boolean;
  accepted_at: string | null;
  unlocked_at: string | null;
  created_at: string;
}): MatchRow {
  return {
    id: r.id,
    jobId: r.job_id,
    clientId: r.client_id,
    contractorId: r.contractor_id,
    status: r.status,
    matchUnlocked: r.match_unlocked,
    acceptedAt: r.accepted_at,
    unlockedAt: r.unlocked_at,
    createdAt: r.created_at,
  };
}

/** Contractor accepts a job — creates or upgrades the match row to 'accepted'. */
export const acceptJobMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => {
    if (!input?.jobId || typeof input.jobId !== "string") {
      throw new Error("jobId is required");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<MatchRow> => {
    const { supabase, userId } = context;

    // Confirm the job is still open/clarifying and read the client.
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, owner_id, status")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    if (!job) throw new Error("Job not found");
    if (job.owner_id === userId) throw new Error("Cannot accept your own job");
    if (!job.owner_id) throw new Error("Job has no owner");
    if (job.status !== "open" && job.status !== "clarifying") {
      throw new Error("Job is no longer open");
    }

    // Upsert on (job_id, contractor_id). client_id is auto-set by the
    // matches_guard trigger from jobs.owner_id.
    const { data: row, error } = await supabase
      .from("matches")
      .upsert(
        {
          job_id: data.jobId,
          client_id: job.owner_id,
          contractor_id: userId,
          status: "accepted",
        },
        { onConflict: "job_id,contractor_id" },
      )
      .select(
        "id, job_id, client_id, contractor_id, status, match_unlocked, accepted_at, unlocked_at, created_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return toRow(row);
  });

/** Client confirms a match — unlocks contact reveal for both parties. */
export const confirmMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { matchId: string }) => {
    if (!input?.matchId || typeof input.matchId !== "string") {
      throw new Error("matchId is required");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<MatchRow> => {
    const { supabase, userId } = context;

    const { data: existing, error: readErr } = await supabase
      .from("matches")
      .select("id, client_id, status")
      .eq("id", data.matchId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!existing) throw new Error("Match not found");
    if (existing.client_id !== userId) {
      throw new Error("Only the client can confirm this match");
    }
    if (existing.status !== "accepted") {
      throw new Error("Contractor has not accepted this match yet");
    }

    // The DB trigger stamps unlocked_at and re-validates the caller.
    const { data: row, error } = await supabase
      .from("matches")
      .update({ match_unlocked: true })
      .eq("id", data.matchId)
      .select(
        "id, job_id, client_id, contractor_id, status, match_unlocked, accepted_at, unlocked_at, created_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return toRow(row);
  });

/**
 * Fetch counterparty contact info for an unlocked match. Returns null when
 * the match is not unlocked or the caller is not a party — never leaks.
 */
export const getMatchContact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { matchId: string }) => {
    if (!input?.matchId || typeof input.matchId !== "string") {
      throw new Error("matchId is required");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<MatchContact | null> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("get_match_contact", {
      _match_id: data.matchId,
    });
    if (error) throw new Error(error.message);
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r) return null;
    return {
      matchId: r.match_id,
      counterpartyId: r.counterparty_id,
      fullName: r.full_name,
      displayName: r.display_name,
      email: r.email,
      phone: r.phone,
      addressLine1: r.address_line1,
      addressLine2: r.address_line2,
      postalCode: r.postal_code,
      city: r.city,
      country: r.country,
    };
  });

/**
 * Direct Bank Payment — fetch the matched tradesperson's IBAN / BIC / bank
 * name from their company profile. Only the homeowner (client) on an
 * accepted match may read these; enforced by the SECURITY DEFINER function
 * `public.get_match_bank_details`.
 */
export const getMatchBankDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { matchId: string }) => {
    if (!input?.matchId || typeof input.matchId !== "string") {
      throw new Error("matchId is required");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<MatchBankDetails | null> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("get_match_bank_details", {
      _match_id: data.matchId,
    });
    if (error) throw new Error(error.message);
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r) return null;
    return {
      matchId: r.match_id,
      contractorId: r.contractor_id,
      companyName: r.company_name,
      accountHolder: r.bank_account_holder,
      iban: r.bank_iban,
      bic: r.bank_bic,
      bankName: r.bank_name,
    };
  });

/**
 * Confirm Booking via Bank Transfer — off-platform manual payment model.
 *
 * The homeowner confirms the booking WITHOUT any online payment processing:
 *   1. Unlocks the match (contact reveal) if not yet unlocked.
 *   2. Advances the job status straight to 'booked' — no payment webhook.
 *   3. Creates the bookings row and the active calendar entry immediately.
 */
export const confirmBookingBankTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { matchId: string }) => {
    if (!input?.matchId || typeof input.matchId !== "string") {
      throw new Error("matchId is required");
    }
    return input;
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{ bookingId: string; jobId: string; scheduledStart: string }> => {
      const { supabase, userId } = context;

      const { data: match, error: readErr } = await supabase
        .from("matches")
        .select(
          "id, job_id, client_id, contractor_id, status, match_unlocked, jobs:jobs(id,title,status)",
        )
        .eq("id", data.matchId)
        .maybeSingle();
      if (readErr) throw new Error(readErr.message);
      if (!match) throw new Error("Match not found");
      if (match.client_id !== userId) {
        throw new Error("Only the homeowner can confirm this booking");
      }
      if (match.status !== "accepted") {
        throw new Error("Tradesperson has not accepted this match yet");
      }

      // 1. Unlock contact reveal (idempotent).
      if (!match.match_unlocked) {
        const { error: unlockErr } = await supabase
          .from("matches")
          .update({ match_unlocked: true })
          .eq("id", data.matchId);
        if (unlockErr) throw new Error(unlockErr.message);
      }

      // 2. Advance job status matched → booked instantly (no payment hook).
      const { error: jobErr } = await supabase
        .from("jobs")
        .update({ status: "booked" })
        .eq("id", match.job_id);
      if (jobErr) throw new Error(jobErr.message);

      // 3. Create the active booking + calendar entry right away.
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(17, 0, 0, 0);

      const jobTitle =
        (match.jobs as { title?: string | null } | null)?.title ??
        `Job ${match.job_id.slice(0, 8)}`;

      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          job_id: match.job_id,
          match_id: match.id,
          client_id: userId,
          provider_id: match.contractor_id,
          status: "scheduled",
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          notes: "Confirmed via direct bank transfer (off-platform payment).",
        })
        .select("id")
        .single();
      if (bookErr) throw new Error(bookErr.message);

      const { error: calErr } = await supabase.from("calendar_events").insert({
        owner_id: userId,
        title: `Booked: ${jobTitle}`,
        notes: "Payment: direct bank transfer — no online payment processed.",
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        event_type: "job",
      });
      if (calErr) throw new Error(calErr.message);

      return {
        bookingId: booking.id,
        jobId: match.job_id,
        scheduledStart: start.toISOString(),
      };
    },
  );
