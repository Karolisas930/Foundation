/**
 * useSiteVisits — the homeowner's site-visit offers, stored in Supabase
 * (`public.site_visits` via src/lib/site-visits.functions.ts) so the awarded
 * contractor actually sees them. Replaces the old localStorage-only store.
 */
import { useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSiteVisit,
  listMySiteVisits,
  saveSiteVisit,
} from "@/lib/site-visits.functions";
import type { SiteVisit } from "../../dashboard/components/parts/helpers";

export const siteVisitsKey = ["site-visits"] as const;

export function useSiteVisits() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listMySiteVisits);
  const saveFn = useServerFn(saveSiteVisit);
  const deleteFn = useServerFn(deleteSiteVisit);

  const query = useQuery({
    queryKey: siteVisitsKey,
    queryFn: () => listFn(),
  });

  const siteVisits = useMemo(() => {
    const out: Record<string, SiteVisit> = {};
    for (const v of query.data?.visits ?? []) {
      out[v.jobId] = { dates: v.dates, slot: v.slot };
    }
    return out;
  }, [query.data]);

  const contractorIds = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const v of query.data?.visits ?? []) out[v.jobId] = v.contractorId;
    return out;
  }, [query.data]);

  const saveVisit = useCallback(
    async (jobId: string, visit: SiteVisit, contractorId?: string | null) => {
      await saveFn({
        data: {
          jobId,
          dates: visit.dates,
          slot: visit.slot,
          contractorId: contractorId ?? contractorIds[jobId] ?? null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: siteVisitsKey });
    },
    [saveFn, queryClient, contractorIds],
  );

  const clearVisit = useCallback(
    async (jobId: string) => {
      await deleteFn({ data: { jobId } });
      await queryClient.invalidateQueries({ queryKey: siteVisitsKey });
    },
    [deleteFn, queryClient],
  );

  return { siteVisits, saveVisit, clearVisit, isLoading: query.isLoading };
}
