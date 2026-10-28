/** Real (backend) job data for the contractor dashboard and Job Radar — no demo ledger. */
import { useEffect, useState } from "react";
import type { EcosystemProject } from "@/core/demo-session";
import { getLandingData } from "@/lib/landing-feed.functions";
import { supabase } from "@/integrations/supabase/client";

export function useRealOpenJobs() {
  const [jobs, setJobs] = useState<EcosystemProject[]>([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    getLandingData()
      .then((d) => {
        if (!alive) return;
        if (d.error) console.error("[job-radar]", d.error);
        setCount(d.openCount);
        setJobs(
          d.jobs.map((j) => ({
            id: j.id,
            title: j.title,
            description: "",
            locationZip: "",
            city: j.city ?? undefined,
            status: j.status,
            budgetTotal: j.budget,
            budgetUsed: 0,
            trade: j.trade ?? undefined,
          })),
        );
      })
      .catch((e) => console.error("[job-radar]", e));
    return () => {
      alive = false;
    };
  }, []);
  return { jobs, openCount: count };
}

/** Number of this contractor's accepted bids (= active jobs). */
export function useActiveJobCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { count, error } = await supabase
        .from("job_bids")
        .select("id", { count: "exact", head: true })
        .eq("contractor_id", data.user.id)
        .eq("status", "accepted");
      if (error) console.error("[active-jobs]", error.message);
      if (alive) setN(count ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return n;
}
