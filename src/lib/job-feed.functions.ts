/**
 * Contractor job feed — real Supabase data.
 *
 * Loads open jobs from `public.jobs`, reads the signed-in contractor's
 * matching profile (min_project_size, service_radius_km, postal_code,
 * trades, languages) and partitions the results with the pure Matching
 * Filter Engine into a priority feed and a silent Alerts feed.
 *
 * Priority feed is sorted by match percentage (highest first).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  partitionLeads,
  type LeadClassification,
  type MatchingProfile,
} from "@/features/shared/matches/matching-engine";

export interface FeedJob {
  id: string;
  title: string;
  description: string;
  trade: string | null;
  budgetTotal: number;
  locationZip: string | null;
  city: string | null;
  language: string | null;
  urgency: string;
  status: "open" | "clarifying" | "matched" | "closed" | "cancelled";
  ownerId: string;
  createdAt: string;
}

export interface ClassifiedJob {
  job: FeedJob;
  classification: LeadClassification;
}

export interface JobFeedResult {
  priority: ClassifiedJob[];
  alerts: ClassifiedJob[];
  appliedThreshold: number;
  hasProfile: boolean;
  profile: {
    minProjectSize: number;
    serviceRadiusKm: number;
    postalCode: string | null;
    city: string | null;
    trades: string[];
    languages: string[];
  };
}

/** Load and classify open jobs for the signed-in contractor. */
export const listContractorJobFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { radiusKm?: number; extraTrades?: string[] } | undefined) => ({
      radiusKm:
        typeof d?.radiusKm === "number" && d.radiusKm > 0 && d.radiusKm <= 500 ? d.radiusKm : undefined,
      extraTrades: Array.isArray(d?.extraTrades)
        ? d!.extraTrades.filter((t) => typeof t === "string" && t.length < 100).slice(0, 30)
        : [],
    }),
  )
  .handler(async ({ context, data }): Promise<JobFeedResult> => {
    const { supabase, userId } = context;

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("min_project_size, service_radius_km, postal_code, city, trades, languages")
      .eq("id", userId)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);

    const matchingProfile: MatchingProfile = {
      minProjectSize: (prof?.min_project_size as number | null) ?? null,
      serviceRadiusKm: data.radiusKm ?? (prof?.service_radius_km as number | null) ?? null,
      postalCode: (prof?.postal_code as string | null) ?? null,
      trades: [...new Set([...((prof?.trades as string[] | null) ?? []), ...data.extraTrades])],
      languages: (prof?.languages as string[] | null) ?? [],
    };

    const { data: rows, error: jobsErr } = await supabase
      .from("jobs")
      .select(
        "id, owner_id, title, description, trade, estimated_budget, location_zip, city, language, urgency, status, created_at",
      )
      .in("status", ["open", "clarifying"])
      .order("created_at", { ascending: false })
      .limit(500);
    if (jobsErr) throw new Error(jobsErr.message);

    const jobs: FeedJob[] = (rows ?? []).map((r: any) => ({
      id: r.id as string,
      title: (r.title as string) ?? "",
      description: (r.description as string) ?? "",
      trade: (r.trade as string | null) ?? null,
      budgetTotal: Number(r.estimated_budget ?? 0),
      locationZip: (r.location_zip as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      language: (r.language as string | null) ?? null,
      urgency: (r.urgency as string) ?? "normal",
      status: r.status as FeedJob["status"],
      ownerId: r.owner_id as string,
      createdAt: r.created_at as string,
    }));

    const partition = partitionLeads(
      jobs.map((j) => ({
        id: j.id,
        estimatedBudget: j.budgetTotal,
        trade: j.trade,
        locationZip: j.locationZip,
        language: j.language,
      })),
      matchingProfile,
    );

    const byId = new Map(jobs.map((j) => [j.id, j]));
    const toClassified = (l: (typeof partition.priority)[number]): ClassifiedJob => ({
      job: byId.get(l.id)!,
      classification: l.classification,
    });

    const priority = partition.priority
      .map(toClassified)
      .sort((a, b) => b.classification.score.percent - a.classification.score.percent);
    const alerts = partition.alerts.map(toClassified);

    return {
      priority,
      alerts,
      appliedThreshold: partition.appliedThreshold,
      hasProfile: prof !== null,
      profile: {
        minProjectSize: matchingProfile.minProjectSize ?? 0,
        serviceRadiusKm: matchingProfile.serviceRadiusKm ?? 0,
        postalCode: matchingProfile.postalCode ?? null,
        city: (prof?.city as string | null) ?? null,
        trades: matchingProfile.trades ? [...matchingProfile.trades] : [],
        languages: matchingProfile.languages ? [...matchingProfile.languages] : [],
      },
    };
  });
