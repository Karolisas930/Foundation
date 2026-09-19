/**
 * Fetches the signed-in homeowner's real projects (see
 * src/lib/homeowner-projects.functions.ts) via the same useServerFn +
 * useQuery pattern already used by the browse feature.
 *
 * Before listing, it claims any project the person posted as a guest
 * (pending_projects) into their account. Doing it here - and not only on
 * /auth/callback - means the project still shows up if they closed that
 * tab or opened the confirmation link on another device.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
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
        await claimPendingProjectsFn();
      } catch {
        // Claiming is best-effort; never block the dashboard on it.
      }
      return listMyProjectsFn();
    },
  });

  const projects: EcosystemProject[] = data?.projects ?? [];

  return { projects, isLoading, error };
}
