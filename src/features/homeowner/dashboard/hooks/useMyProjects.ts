/**
 * Fetches the signed-in homeowner's real projects (see
 * src/lib/homeowner-projects.functions.ts) via the same useServerFn +
 * useQuery pattern already used by the browse feature.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProjects } from "@/lib/homeowner-projects.functions";
import type { EcosystemProject } from "@/core/demo-session";

export function useMyProjects() {
  const listMyProjectsFn = useServerFn(listMyProjects);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => listMyProjectsFn(),
  });

  const projects: EcosystemProject[] = data?.projects ?? [];

  return { projects, isLoading, error };
}
