/**
 * Real (non-demo) data for the homeowner dashboard. Fetches the signed-in
 * user's own job postings from `public.jobs` and reshapes each row into
 * the `EcosystemProject` type the existing UI components (MyProjectsList,
 * ProjectDetailsPanel, etc.) already expect - so those components need no
 * changes at all.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EcosystemProject } from "@/core/demo-session";

type JobRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  trade: string | null;
  estimated_budget: number | null;
  location_zip: string | null;
  city: string | null;
  language: string | null;
  urgency: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const STATUS_MAP: Record<string, EcosystemProject["status"]> = {
  open: "open",
  clarifying: "clarifying",
  awarded: "awarded",
  completed: "completed",
};

function toEcosystemProject(job: JobRow): EcosystemProject {
  return {
    id: job.id,
    seekerId: job.owner_id,
    title: job.title,
    description: job.description ?? "",
    locationZip: job.location_zip ?? "",
    city: job.city ?? undefined,
    status: STATUS_MAP[job.status] ?? "open",
    budgetTotal: job.estimated_budget ?? 0,
    budgetUsed: 0,
    trade: job.trade ?? undefined,
    language: job.language ?? undefined,
  };
}

/** List every job the signed-in homeowner has posted, most recent first. */
export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ projects: EcosystemProject[] }> => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, owner_id, title, description, trade, estimated_budget, location_zip, city, language, urgency, status, created_at, updated_at",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { projects: ((data ?? []) as JobRow[]).map(toEcosystemProject) };
  });

const updateInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  estimatedBudget: z.number().int().min(0).max(100_000_000),
  city: z.string().trim().max(120).optional().nullable(),
  locationZip: z.string().trim().max(20).optional().nullable(),
});

/** Update one of my own job postings. */
export const updateMyProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateInput.parse(data))
  .handler(async ({ context, data }): Promise<{ project: EcosystemProject }> => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("jobs")
      .update({
        title: data.title,
        description: data.description ?? null,
        estimated_budget: data.estimatedBudget,
        city: data.city || null,
        location_zip: data.locationZip || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("owner_id", userId)
      .select(
        "id, owner_id, title, description, trade, estimated_budget, location_zip, city, language, urgency, status, created_at, updated_at",
      )
      .single();

    if (error) throw new Error(error.message);
    return { project: toEcosystemProject(row as JobRow) };
  });
