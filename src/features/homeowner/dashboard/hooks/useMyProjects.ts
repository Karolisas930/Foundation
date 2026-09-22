/**
 * Fetches the signed-in homeowner's real projects (see
 * src/lib/homeowner-projects.functions.ts) via the same useServerFn +
 * useQuery pattern already used by the browse feature.
 *
 * Before listing, it claims any project the person posted as a guest
 * (pending_projects) into their account. Doing it here - and not only on
 * /auth/callback - means the project still shows up if they closed that
 * tab or opened the confirmation link on another device.
 *
 * A failed claim is never silent: it is logged and surfaced as a toast, so
 * "No projects yet" can't hide a broken attachment ever again.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMyProjects } from "@/lib/homeowner-projects.functions";
import { claimPendingProjects } from "@/lib/pending-projects.functions";
import type { EcosystemProject } from "@/core/demo-session";

export function useMyProjects() {
  const listMyProjectsFn = useServerFn(listMyProjects);
  const claimPendingProjectsFn = useServerFn(claimPendingProjects);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => {
      try {
        const claimed = await claimPendingProjectsFn();
        if (claimed?.jobIds?.length) {
          console.info("[pending-projects] attached on dashboard load", claimed.jobIds);
          toast.success(
            claimed.jobIds.length === 1
              ? "We found the project you posted before signing up and added it to your dashboard."
              : `We added ${claimed.jobIds.length} projects you posted before signing up.`,
          );
        }
      } catch (claimErr) {
        // Claiming never blocks the dashboard, but it must not fail silently.
        console.error("[pending-projects] claim failed on dashboard load", claimErr);
        toast.error(
          `We couldn't attach the project you posted before signing up${
            claimErr instanceof Error ? ` (${claimErr.message})` : ""
          }. Please reload to retry.`,
          { duration: 12000 },
        );
      }
      return listMyProjectsFn();
    },
  });

  const projects: EcosystemProject[] = data?.projects ?? [];

  return { projects, isLoading, error };
}
