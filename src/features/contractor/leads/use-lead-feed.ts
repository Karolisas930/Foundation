/**
 * Single client-side seam for the contractor lead feed.
 *
 * Replaces the old per-browser demo ledger (`lead-dispatch.ts`): leads are
 * open jobs read from Supabase and classified server-side by the Matching
 * Filter Engine in `@/lib/job-feed.functions`.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContractorJobFeed, type JobFeedResult } from "@/lib/job-feed.functions";

export const LEAD_FEED_QUERY_KEY = ["contractor", "lead-feed"] as const;

const EMPTY: JobFeedResult = {
  priority: [],
  alerts: [],
  appliedThreshold: 0,
  hasProfile: false,
  profile: {
    minProjectSize: 0,
    serviceRadiusKm: 0,
    postalCode: null,
    city: null,
    trades: [],
    languages: [],
  },
};

/** Classified lead feed for the signed-in contractor. */
export function useLeadFeed() {
  const fetchFeed = useServerFn(listContractorJobFeed);
  const query = useQuery({
    queryKey: LEAD_FEED_QUERY_KEY,
    queryFn: () => fetchFeed(),
    staleTime: 30_000,
    retry: false,
  });
  return { ...query, feed: query.data ?? EMPTY };
}
