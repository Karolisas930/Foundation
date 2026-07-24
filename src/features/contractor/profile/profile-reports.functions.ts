import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REASONS = ["unauthorized_trade", "forged_documents", "misconduct", "other"] as const;

export type ProfileReportReason = (typeof REASONS)[number];

const inputSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(REASONS),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const reportProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.reportedId === userId) {
      throw new Error("Du kannst dein eigenes Profil nicht melden.");
    }

    const { error } = await supabase.from("profile_reports").insert({
      reporter_id: userId,
      reported_id: data.reportedId,
      reason: data.reason,
      notes: data.notes?.trim() ? data.notes.trim() : null,
    });

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
