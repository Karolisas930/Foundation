/**
 * React Query hooks over the crew / hours server functions.
 * One shared cache entry each, so every job card, sheet and dialog stays
 * in sync after a mutation.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addJobCrewMember,
  listMyJobCrew,
  listMyJobHours,
  logJobHours,
  removeJobCrewMember,
  type HoursRow,
} from "@/lib/job-crew.functions";

export const JOB_CREW_QUERY_KEY = ["contractor", "job-crew"] as const;
export const JOB_HOURS_QUERY_KEY = ["contractor", "job-hours"] as const;

/** bookingId -> assigned crew names. */
export function useCrewMap(): Record<string, string[]> {
  const fetchCrew = useServerFn(listMyJobCrew);
  const query = useQuery({ queryKey: JOB_CREW_QUERY_KEY, queryFn: () => fetchCrew() });
  return useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const row of query.data?.crew ?? []) {
      (map[row.bookingId] ??= []).push(row.name);
    }
    return map;
  }, [query.data]);
}

export function useJobCrew(bookingId: string | null): string[] {
  const map = useCrewMap();
  return bookingId ? (map[bookingId] ?? []) : [];
}

export function useCrewMutations() {
  const queryClient = useQueryClient();
  const add = useServerFn(addJobCrewMember);
  const remove = useServerFn(removeJobCrewMember);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: JOB_CREW_QUERY_KEY });

  const addMember = useMutation({
    mutationFn: (data: { bookingId: string; name: string }) => add({ data }),
    onSuccess: invalidate,
  });
  const removeMember = useMutation({
    mutationFn: (data: { bookingId: string; name: string }) => remove({ data }),
    onSuccess: invalidate,
  });
  return { addMember, removeMember };
}

export function useHoursRows(): HoursRow[] {
  const fetchHours = useServerFn(listMyJobHours);
  const query = useQuery({ queryKey: JOB_HOURS_QUERY_KEY, queryFn: () => fetchHours() });
  return query.data?.hours ?? [];
}

export function useHoursForJob(bookingId: string | null): HoursRow[] {
  const rows = useHoursRows();
  return useMemo(
    () => (bookingId ? rows.filter((r) => r.bookingId === bookingId) : []),
    [rows, bookingId],
  );
}

export function useHoursTotals(): Record<string, number> {
  const rows = useHoursRows();
  return useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of rows) totals[r.bookingId] = (totals[r.bookingId] ?? 0) + r.hours;
    return totals;
  }, [rows]);
}

export function useLogHours() {
  const queryClient = useQueryClient();
  const log = useServerFn(logJobHours);
  return useMutation({
    mutationFn: (data: {
      bookingId: string;
      staff: string;
      hours: number;
      date: string;
      note?: string | null;
    }) => log({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOB_HOURS_QUERY_KEY }),
  });
}
