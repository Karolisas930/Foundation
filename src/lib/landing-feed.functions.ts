/**
 * Public landing-page data (real, no demo): open jobs, verified pros and
 * counts. Uses the publishable key + SECURITY DEFINER RPCs that expose only
 * safe columns. Never throws — on failure returns empty data plus an error
 * string so the page shows a clean empty state.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface LandingJob {
  id: string;
  title: string;
  trade: string | null;
  city: string | null;
  budget: number;
  status: "open" | "clarifying";
}

export interface LandingPro {
  id: string;
  name: string;
  trade: string | null;
  city: string | null;
}

export interface LandingData {
  jobs: LandingJob[];
  pros: LandingPro[];
  openCount: number;
  proCount: number;
  error: string | null;
}

function env(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

export const getLandingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingData> => {
    const empty: LandingData = { jobs: [], pros: [], openCount: 0, proCount: 0, error: null };
    const url = env("SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
    const key = env(
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    if (!url || !key) return { ...empty, error: "Backend not configured" };

    const sb = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const [jobsRes, prosRes, statsRes] = await Promise.all([
      sb.rpc("list_public_open_jobs", { _limit: 12 }),
      sb.rpc("list_public_profiles", { _search: null, _limit: 4 }),
      sb.rpc("get_public_landing_stats"),
    ]);

    const errors = [jobsRes.error, prosRes.error, statsRes.error].filter(Boolean);
    if (errors.length) console.error("[landing-feed]", errors.map((e) => e?.message));

    type JobRow = { id: string; title: string; trade: string | null; city: string | null; estimated_budget: number | null; status: string };
    type ProRow = { id: string; business_name: string | null; trade: string | null; city: string | null };
    type StatRow = { open_jobs: number; pros: number };

    const jobs = ((jobsRes.data as JobRow[] | null) ?? []).map((j) => ({
      id: j.id,
      title: j.title,
      trade: j.trade,
      city: j.city,
      budget: Number(j.estimated_budget ?? 0),
      status: (j.status === "clarifying" ? "clarifying" : "open") as LandingJob["status"],
    }));
    const pros = ((prosRes.data as ProRow[] | null) ?? []).map((p) => ({
      id: p.id,
      name: p.business_name?.trim() || "Verified pro",
      trade: p.trade,
      city: p.city,
    }));
    const stat = ((statsRes.data as StatRow[] | null) ?? [])[0];

    return {
      jobs,
      pros,
      openCount: Number(stat?.open_jobs ?? jobs.filter((j) => j.status === "open").length),
      proCount: Number(stat?.pros ?? pros.length),
      error: errors.length ? (errors[0]?.message ?? "Load failed") : null,
    };
  },
);
