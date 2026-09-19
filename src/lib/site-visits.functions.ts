/**
 * Site visits — the days + time slot a homeowner offers the contractor who
 * won their project. Real Supabase data in `public.site_visits`
 * (db/manual-migrations/20260918120000_site_visits.sql); previously this only
 * existed in the browser's localStorage, so the contractor never saw it.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
export type SiteVisitSlot = (typeof TIME_SLOTS)[number];

export interface SiteVisitRecord {
  jobId: string;
  contractorId: string | null;
  dates: string[];
  slot: SiteVisitSlot;
}

const SELECT = "job_id, contractor_id, dates, slot";

type Row = {
  job_id: string;
  contractor_id: string | null;
  dates: string[] | null;
  slot: string | null;
};

function toRecord(row: Row): SiteVisitRecord {
  return {
    jobId: row.job_id,
    contractorId: row.contractor_id,
    dates: (row.dates ?? []).map((d) => new Date(d).toISOString()).sort(),
    slot: (TIME_SLOTS as readonly string[]).includes(row.slot ?? "")
      ? (row.slot as SiteVisitSlot)
      : "morning",
  };
}

/** Every site visit the signed-in user is part of (as homeowner or contractor). */
export const listMySiteVisits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ visits: SiteVisitRecord[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await untyped(supabase)
      .from("site_visits")
      .select(SELECT)
      .or(`homeowner_id.eq.${userId},contractor_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return { visits: ((data ?? []) as Row[]).map(toRecord) };
  });

const saveInput = z.object({
  jobId: z.string().uuid(),
  contractorId: z.string().uuid().nullable().optional(),
  dates: z.array(z.string().datetime()).max(7),
  slot: z.enum(TIME_SLOTS).default("morning"),
});

/** Create or replace the site-visit offer for one project. */
export const saveSiteVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => saveInput.parse(data))
  .handler(async ({ context, data }): Promise<{ visit: SiteVisitRecord }> => {
    const { supabase, userId } = context;

    const { data: row, error } = await untyped(supabase)
      .from("site_visits")
      .upsert(
        {
          job_id: data.jobId,
          homeowner_id: userId,
          contractor_id: data.contractorId ?? null,
          dates: data.dates,
          slot: data.slot ?? "morning",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "job_id" },
      )
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return { visit: toRecord(row as Row) };
  });

/** Remove the site-visit offer for one project (e.g. after cancelling). */
export const deleteSiteVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ jobId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await untyped(supabase)
      .from("site_visits")
      .delete()
      .eq("job_id", data.jobId)
      .eq("homeowner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
