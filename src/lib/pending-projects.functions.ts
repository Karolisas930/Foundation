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

function getEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value;
}

function createPublicClient() {
  return createClient<Database>(getEnv("SUPABASE_URL"), getEnv("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const pendingProjectSchema = z.object({
  email: z.string().email(),
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
 */
export const savePendingProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => pendingProjectSchema.parse(data))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const supabase = createPublicClient();
    const { data: inserted, error } = await supabase
      .from("pending_projects")
      .insert({
        email: data.email,
        title: data.title,
        description: data.description ?? null,
        trade: data.trade ?? null,
        estimated_budget: data.estimatedBudget ?? null,
        location_zip: data.locationZip ?? null,
        city: data.city ?? null,
        language: data.language ?? null,
        urgency: data.urgency ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
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
    if (error) throw new Error(error.message);
    const jobIds = ((data ?? []) as Array<{ job_id: string }>).map((row) => row.job_id);
    return { jobIds };
  });
