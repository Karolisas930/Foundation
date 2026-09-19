/**
 * Real bids for one homeowner project, reshaped into the `EcosystemProposal`
 * type the existing dashboard panels render.
 */
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listBidsForMyProject, type ProjectBid } from "@/lib/job-bids.functions";
import type { EcosystemProposal } from "@/core/demo-session";

export const projectBidsKey = (jobId: string | null) => ["project-bids", jobId] as const;

export function formatRelative(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return undefined;
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function toProposal(bid: ProjectBid): EcosystemProposal {
  return {
    id: bid.id,
    projectId: bid.jobId,
    company: bid.contractorName,
    city: bid.contractorCity ?? undefined,
    rating: 0,
    labor: Math.round(bid.laborCents / 100),
    materials: Math.round(bid.materialsCents / 100),
    travel: Math.round(bid.travelCents / 100),
    postedAt: formatRelative(bid.sentAt ?? bid.createdAt),
    profileId: bid.contractorId,
  };
}

/** Bids the homeowner should act on: sent (pending) or accepted. */
export function isVisibleBid(bid: ProjectBid): boolean {
  return bid.status === "sent" || bid.status === "accepted";
}

export function useProjectBids(jobId: string | null) {
  const fetchBids = useServerFn(listBidsForMyProject);

  const query = useQuery({
    queryKey: projectBidsKey(jobId),
    queryFn: () => fetchBids({ data: { jobId: jobId as string } }),
    enabled: Boolean(jobId),
  });

  const bids = useMemo(() => (query.data?.bids ?? []).filter(isVisibleBid), [query.data]);
  const proposals = useMemo(() => {
    const accepted = bids.filter((b) => b.status === "accepted");
    return (accepted.length ? accepted : bids).map(toProposal);
  }, [bids]);

  return { bids, proposals, isLoading: query.isLoading, error: query.error };
}
