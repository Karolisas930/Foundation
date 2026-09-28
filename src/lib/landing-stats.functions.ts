/**
 * Public homepage data: real open jobs, real contractor profiles and counts.
 * Only non-sensitive columns are returned (no contact, bank or address data).
 */
import { createServerFn } from "@tanstack/react-start";
import type { EcosystemProject } from "@/core/demo-session";

export type LandingPro = {
  id: string;
  name: string;
  trade: string;
  city: string | null;
  zip: string | null;
  rating: number | null;
  verified: boolean;
};

export type LandingData = {
  jobs: EcosystemProject[];
  openCount: number;
  pros: LandingPro[];
  verifiedPros: LandingPro[];
  proCount: number;
  cityCount: number;
};

const EMPTY: LandingData = { jobs: [], openCount: 0, pros: [], verifiedPros: [], proCount: 0, cityCount: 0 };

export const getLandingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingData> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [jobsRes, prosRes] = await Promise.all([
        supabaseAdmin
          .from("jobs")
          .select("id, title, trade, city, location_zip, estimated_budget, status, created_at", {
            count: "exact",
          })
          .in("status", ["open", "clarifying"])
          .order("created_at", { ascending: false })
          .limit(12),
        supabaseAdmin
          .from("profiles")
          .select("id, display_name, company_name, full_name, city, postal_code, trades", { count: "exact" })
          .not("account_type", "is", null)
          .neq("account_type", "homeowner")
          .eq("flagged", false)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      // Fully verified pros only (contractors.verified = true).
      const { data: verRows } = await supabaseAdmin
        .from("contractors")
        .select("user_id, rating_avg")
        .eq("verified", true)
        .limit(200);
      const verMap = new Map<string, number | null>(
        ((verRows ?? []) as Array<{ user_id: string; rating_avg: number | null }>).map((v) => [
          v.user_id,
          v.rating_avg,
        ]),
      );
      let verifiedProRows: unknown[] = [];
      if (verMap.size > 0) {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, company_name, full_name, city, postal_code, trades")
          .in("id", [...verMap.keys()])
          .eq("flagged", false)
          .order("created_at", { ascending: false })
          .limit(50);
        verifiedProRows = data ?? [];
      }

      const jobRows = (jobsRes.data ?? []) as Array<{
        id: string;
        title: string;
        trade: string | null;
        city: string | null;
        location_zip: string | null;
        estimated_budget: number | null;
        status: string;
      }>;
      const jobs: EcosystemProject[] = jobRows.map((j) => ({
        id: j.id,
        title: j.title,
        description: "",
        locationZip: j.location_zip ?? "",
        city: j.city ?? undefined,
        status: j.status === "clarifying" ? "clarifying" : "open",
        budgetTotal: j.estimated_budget ?? 0,
        budgetUsed: 0,
        trade: j.trade ?? undefined,
      }));

      type ProRow = {
        id: string;
        display_name: string | null;
        company_name: string | null;
        full_name: string | null;
        city: string | null;
        postal_code: string | null;
        trades: string[] | null;
      };
      const toPro = (p: ProRow): LandingPro => ({
        id: p.id,
        name: p.company_name || p.display_name || p.full_name || "Trade professional",
        trade: (p.trades ?? []).slice(0, 2).join(", ") || "Trade professional",
        city: p.city,
        zip: p.postal_code,
        rating: verMap.get(p.id) != null ? Number(verMap.get(p.id)) : null,
        verified: verMap.has(p.id),
      });
      const pros = ((prosRes.data ?? []) as ProRow[]).map(toPro);
      const verifiedPros = (verifiedProRows as ProRow[]).map(toPro);

      const cities = new Set(
        [...jobRows.map((j) => j.city), ...pros.map((p) => p.city)]
          .filter((c): c is string => !!c)
          .map((c) => c.trim().toLowerCase()),
      );

      return {
        jobs,
        openCount: jobsRes.count ?? jobs.length,
        pros,
        verifiedPros,
        proCount: prosRes.count ?? pros.length,
        cityCount: cities.size,
      };
    } catch (err) {
      console.error("[landing] failed to load homepage data", err);
      return EMPTY;
    }
  },
);
