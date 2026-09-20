/**
 * Crew assignments + logged working hours for contractor bookings.
 *
 * Replaces the former per-browser localStorage ledger: every row lives in
 * `public.job_crew` / `public.job_hours`, scoped by RLS to the contractor
 * (`provider_id = auth.uid()`) who owns the booking.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export interface CrewRow {
  bookingId: string;
  name: string;
}

export interface HoursRow {
  id: string;
  bookingId: string;
  staff: string;
  hours: number;
  date: string;
  note: string | null;
  createdAt: string;
}

/** Every crew assignment across my bookings. */
export const listMyJobCrew = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ crew: CrewRow[] }> => {
    const { data, error } = await untyped(context.supabase)
      .from("job_crew")
      .select("booking_id, member_name")
      .eq("provider_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return {
      crew: ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        bookingId: String(r.booking_id),
        name: String(r.member_name),
      })),
    };
  });

/** Every hour log across my bookings, newest first. */
export const listMyJobHours = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ hours: HoursRow[] }> => {
    const { data, error } = await untyped(context.supabase)
      .from("job_hours")
      .select("id, booking_id, staff_name, hours, work_date, note, created_at")
      .eq("provider_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      hours: ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        bookingId: String(r.booking_id),
        staff: String(r.staff_name ?? "Me"),
        hours: Number(r.hours ?? 0),
        date: String(r.work_date),
        note: (r.note as string | null) ?? null,
        createdAt: String(r.created_at),
      })),
    };
  });

/** Assign someone to one of my bookings (idempotent per name). */
export const addJobCrewMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        bookingId: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase)
      .from("job_crew")
      .upsert(
        {
          booking_id: data.bookingId,
          provider_id: context.userId,
          member_name: data.name,
        },
        { onConflict: "booking_id,member_name", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove someone from one of my bookings. */
export const removeJobCrewMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        bookingId: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase)
      .from("job_crew")
      .delete()
      .eq("provider_id", context.userId)
      .eq("booking_id", data.bookingId)
      .eq("member_name", data.name);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Log working hours against one of my bookings. */
export const logJobHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        bookingId: z.string().uuid(),
        staff: z.string().trim().min(1).max(120).default("Me"),
        hours: z.number().positive().max(24),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        note: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await untyped(context.supabase).from("job_hours").insert({
      booking_id: data.bookingId,
      provider_id: context.userId,
      staff_name: data.staff,
      hours: data.hours,
      work_date: data.date,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
