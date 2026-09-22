// @ts-nocheck
/**
 * Bridges the gap between "guest posts a project" and "guest actually has
 * an account". savePendingProject runs with no auth (the person doesn't
 * have a session yet). claimPendingProjects runs authenticated, from
 * /auth/callback, and just calls the SECURITY DEFINER claim_pending_
 * projects() RPC (see the pending_projects migration) - that function
 * derives the caller's own verified email itself, so this wrapper never
 * needs to pass or trust an email value.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { createServerPublicClient } from "@/integrations/supabase/server-public-client";

function createPublicClient() {
  return createServerPublicClient();
}

const pendingProjectSchema = z.object({
  // Normalised here on purpose: claim_pending_projects() matches this value
  // against auth.users.email, which Supabase stores lowercased. Saving the
  // raw form input ("Karolis@Gmail.com") meant the project was never matched
  // after email confirmation and silently never appeared on the dashboard.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional(),
  trade: z.string().trim().max(200).optional(),
  estimatedBudget: z.number().int().positive().optional(),
  locationZip: z.string().trim().max(20).optional(),
  city: z.string().trim().max(120).optional(),
  language: z.string().trim().max(40).optional(),
  urgency: z.string().trim().max(40).optional(),
});

/**
 * PUBLIC (unauth) - saves a guest's project so it can be claimed once they
 * actually confirm an account. Never touches the real `jobs` table.
 *
 * IMPORTANT: do NOT add `.select()` here. pending_projects deliberately has
 * an INSERT-only grant/policy for anon + authenticated (all reads happen
 * inside the SECURITY DEFINER claim function). Asking PostgREST to return the
 * inserted row makes it run INSERT ... RETURNING, which needs SELECT
 * privilege, so every guest save failed with "permission denied for table
 * pending_projects" - the project was never stored and therefore could never
 * be claimed after email confirmation. The id is generated here instead.
 */
export const savePendingProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => pendingProjectSchema.parse(data))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const supabase = createPublicClient();
    const id = crypto.randomUUID();
    const { error } = await supabase.from("pending_projects").insert({
      id,
      email: data.email,
      title: data.title,
      description: data.description ?? null,
      trade: data.trade ?? null,
      estimated_budget: data.estimatedBudget ?? null,
      location_zip: data.locationZip ?? null,
      city: data.city ?? null,
      language: data.language ?? null,
      urgency: data.urgency ?? null,
    });
    if (error) {
      console.error("[pending-projects] save failed", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw new Error(`Could not store your project for later: ${error.message}`);
    }
    console.info("[pending-projects] saved pending project", { id, title: data.title });
    return { id };
  });

/**
 * AUTH'D - claims every pending project matching the signed-in user's own
 * verified email into the real `jobs` table. Safe to call every time
 * someone lands on /auth/callback; already-claimed rows are a no-op.
 */
export const claimPendingProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ jobIds: string[] }> => {
    const { data, error } = await context.supabase.rpc("claim_pending_projects");
    if (error) {
      console.error("[pending-projects] claim failed", {
        userId: context.userId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Could not attach your posted project to this account: ${error.message}`);
    }
    const jobIds = ((data ?? []) as Array<{ job_id: string }>).map((row) => row.job_id);
    console.info("[pending-projects] claim complete", {
      userId: context.userId,
      claimed: jobIds.length,
    });
    return { jobIds };
  });
