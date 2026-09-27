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
};

export type LandingData = {
  jobs: EcosystemProject[];
  openCount: number;
  pros: LandingPro[];
  proCount: number;
  cityCount: number;
};

const EMPTY: LandingData = { jobs: [], openCount: 0, pros: [], proCount: 0, cityCount: 0 };

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
          .select("id, display_name, company_name, full_name, city, trades", { count: "exact" })
          .not("account_type", "is", null)
          .neq("account_type", "homeowner")
          .eq("flagged", false)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

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
        trades: string[] | null;
      };
      const pros: LandingPro[] = ((prosRes.data ?? []) as ProRow[]).map((p) => ({
        id: p.id,
        name: p.company_name || p.display_name || p.full_name || "Verified pro",
        trade: (p.trades ?? []).slice(0, 2).join(", ") || "Trade professional",
        city: p.city,
      }));

      const cities = new Set(
        [...jobRows.map((j) => j.city), ...pros.map((p) => p.city)]
          .filter((c): c is string => !!c)
          .map((c) => c.trim().toLowerCase()),
      );

      return {
        jobs,
        openCount: jobsRes.count ?? jobs.length,
        pros,
        proCount: prosRes.count ?? pros.length,
        cityCount: cities.size,
      };
    } catch (err) {
      console.error("[landing] failed to load homepage data", err);
      return EMPTY;
    }
  },
);
