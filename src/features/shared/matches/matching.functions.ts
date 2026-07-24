/**
 * Server-side job matching.
 *
 * Wraps the pure `matching-engine` with a `createServerFn` that reads the
 * caller's contractor profile from Supabase (min_project_size,
 * service_radius_km, postal_code, trades, languages) and returns a
 * 0–100 % match score for a supplied job payload.
 *
 * The frontend feed continues to render the same score inline via the
 * pure engine (no round-trip needed for the demo ledger); this function
 * is the canonical seam for any real jobs table that lands later.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeMatchScore,
  classifyLead,
  type MatchScoreBreakdown,
  type LeadClassification,
} from "@/features/shared/matches/matching-engine";

const jobSchema = z.object({
  id: z.string().min(1),
  estimatedBudget: z.number().nonnegative(),
  trade: z.string().nullish(),
  locationZip: z.string().nullish(),
  language: z.string().nullish(),
});

export type MatchJobInput = z.infer<typeof jobSchema>;

export type MatchJobResult = {
  score: MatchScoreBreakdown;
  classification: LeadClassification;
  profile: {
    minProjectSize: number;
    serviceRadiusKm: number;
    postalCode: string | null;
    trades: string[];
    languages: string[];
  };
};

/**
 * Match a job payload against the signed-in contractor's profile.
 * Returns the % score, subscore breakdown, and hard-filter classification.
 */
export const matchJobToWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => jobSchema.parse(data))
  .handler(async ({ data, context }): Promise<MatchJobResult> => {
    const { data: prof, error } = await context.supabase
      .from("profiles")
      .select("min_project_size, service_radius_km, postal_code")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Trades + languages are not yet persisted server-side; the classifier
    // treats missing arrays as neutral (see matching-engine defaults).
    const matchingProfile = {
      minProjectSize: (prof?.min_project_size as number | null) ?? null,
      serviceRadiusKm: (prof?.service_radius_km as number | null) ?? null,
      postalCode: (prof?.postal_code as string | null) ?? null,
      trades: [] as string[],
      languages: [] as string[],
    };

    const lead = {
      id: data.id,
      estimatedBudget: data.estimatedBudget,
      trade: data.trade ?? null,
      locationZip: data.locationZip ?? null,
      language: data.language ?? null,
    };

    const score = computeMatchScore(lead, matchingProfile);
    const classification = classifyLead(lead, matchingProfile);

    return {
      score,
      classification,
      profile: {
        minProjectSize: matchingProfile.minProjectSize ?? 0,
        serviceRadiusKm: matchingProfile.serviceRadiusKm ?? 0,
        postalCode: matchingProfile.postalCode,
        trades: matchingProfile.trades,
        languages: matchingProfile.languages,
      },
    };
  });
