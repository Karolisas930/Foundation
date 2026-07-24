export function useMyProjects() {
  return { projects: [] as Array<{ id: string; title: string }>, isLoading: false };
}
