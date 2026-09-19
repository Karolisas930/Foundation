/**
 * ActiveJobsPage — the tradesperson's daily command center.
 *
 * Jobs come from Supabase (bookings awarded to the signed-in contractor) via
 * `@/lib/active-jobs.functions`. Crew and hour logs stay device-local.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowUpDown,
  Briefcase,
  CalendarDays,
  Search,
  Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listMyActiveJobs,
  updateMyActiveJob,
  type ActiveJob,
} from "@/lib/active-jobs.functions";
import { SiteDiarySheet } from "@/features/contractor/team/components/SiteDiarySheet";
import { setActiveJobId } from "@/features/contractor/team/site-diary-store";
import { LogHoursDialog } from "./LogHoursDialog";
import { AddReceiptDialog } from "./AddReceiptDialog";
import { EmptyState } from "./EmptyState";
import { FILTERS, derive, progressOf, statusMeta, type FilterKey, type SortKey } from "./active-jobs-store";
import { SummaryCard } from "./atoms";
import { JobCard } from "./JobCard";
import { JobDetailSheet } from "./JobDetailSheet";

export const ACTIVE_JOBS_QUERY_KEY = ["contractor", "active-jobs"] as const;

export function ActiveJobsPage() {
  const queryClient = useQueryClient();
  const fetchJobs = useServerFn(listMyActiveJobs);
  const saveJob = useServerFn(updateMyActiveJob);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [hoursJobId, setHoursJobId] = useState<string | null>(null);
  const [receiptJobId, setReceiptJobId] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ACTIVE_JOBS_QUERY_KEY,
    queryFn: () => fetchJobs(),
  });

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateMyActiveJob>[0] extends never ? never : {
      bookingId: string;
      status?: ActiveJob["status"];
      scheduledStart?: string | null;
      scheduledEnd?: string | null;
      notes?: string | null;
    }) => saveJob({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_JOBS_QUERY_KEY }),
    onError: (err: Error) => toast.error("Could not save", { description: err.message }),
  });

  const jobs = useMemo<ActiveJob[]>(
    () => (jobsQuery.data?.jobs ?? []).filter((j) => j.status !== "cancelled"),
    [jobsQuery.data],
  );

  const enriched = useMemo(
    () => jobs.map((job) => ({ job, d: derive(job), progress: progressOf(job) })),
    [jobs],
  );

  const summary = useMemo(() => {
    const total = enriched.length;
    const today = enriched.filter((e) => e.d.isToday).length;
    const overdue = enriched.filter((e) => e.d.isOverdue).length;
    const avg = total === 0 ? 0 : Math.round(enriched.reduce((s, e) => s + e.progress, 0) / total);
    return { total, today, overdue, avg };
  }, [enriched]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = enriched.filter(({ job, d }) => {
      if (filter === "today" && !d.isToday) return false;
      if (filter === "week" && (!d.hasSchedule || d.daysFromToday < 0 || d.daysFromToday > 7))
        return false;
      if (filter === "overdue" && !d.isOverdue) return false;
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        (job.city ?? "").toLowerCase().includes(q) ||
        (job.trade ?? "").toLowerCase().includes(q) ||
        job.clientName.toLowerCase().includes(q)
      );
    });
    const urgencyRank = { high: 0, normal: 1, low: 2 } as const;
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "progress":
          return b.progress - a.progress;
        case "client":
          return a.job.clientName.localeCompare(b.job.clientName);
        case "urgency":
          return urgencyRank[a.d.urgency] - urgencyRank[b.d.urgency];
        case "date":
        default:
          return a.d.scheduledAt.getTime() - b.d.scheduledAt.getTime();
      }
    });
    return list;
  }, [enriched, filter, query, sort]);

  const detail = jobs.find((j) => j.bookingId === detailId) ?? null;
  const detailDerived = detail ? derive(detail) : null;

  function openDiary(id: string) {
    setActiveJobId(id);
    setDetailId(null);
    setDiaryOpen(true);
  }

  function markCompleted(id: string) {
    mutation.mutate(
      { bookingId: id, status: "completed" },
      {
        onSuccess: () => {
          setDetailId(null);
          toast.success("Job marked as completed", { duration: 2500 });
        },
      },
    );
  }

  function changeStatus(id: string, status: ActiveJob["status"]) {
    mutation.mutate(
      { bookingId: id, status },
      {
        onSuccess: () =>
          toast.success(`Status updated to ${statusMeta({ status }).label}`, { duration: 2000 }),
      },
    );
  }

  function saveSchedule(
    id: string,
    patch: { scheduledStart: string | null; scheduledEnd: string | null; notes: string },
  ) {
    mutation.mutate(
      { bookingId: id, ...patch },
      { onSuccess: () => toast.success("Schedule saved", { duration: 2000 }) },
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
          <Briefcase className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">Jobs</p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-white">
            Active Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your booked and in-progress jobs. Track schedule, crew and progress at a glance.
          </p>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard
          label="Active Jobs"
          value={summary.total}
          icon={<Briefcase className="size-4" />}
        />
        <SummaryCard
          label="Jobs Today"
          value={summary.today}
          icon={<CalendarDays className="size-4" />}
          accent="text-sky-300"
        />
        <SummaryCard
          label="Avg. Progress"
          value={`${summary.avg}%`}
          icon={<Timer className="size-4" />}
          accent="text-orange-glow"
        />
        <SummaryCard
          label="Overdue"
          value={summary.overdue}
          icon={<AlertTriangle className="size-4" />}
          accent={summary.overdue > 0 ? "text-rose-300" : "text-slate-300"}
          alert={summary.overdue > 0}
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, client, city or trade…"
            className="h-11 rounded-full border-white/10 bg-white/[0.04] pl-9 text-sm text-white placeholder:text-slate-500 focus-visible:ring-orange/60"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-11 w-full rounded-full border-white/10 bg-white/[0.04] text-sm text-white sm:w-[200px]">
            <ArrowUpDown className="mr-2 size-4 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort: Scheduled date</SelectItem>
            <SelectItem value="urgency">Sort: Urgency</SelectItem>
            <SelectItem value="progress">Sort: Progress</SelectItem>
            <SelectItem value="client">Sort: Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div role="tablist" aria-label="Active jobs filter" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count =
            f.id === "overdue"
              ? summary.overdue
              : f.id === "today"
                ? summary.today
                : f.id === "all"
                  ? summary.total
                  : enriched.filter(
                      (e) => e.d.hasSchedule && e.d.daysFromToday >= 0 && e.d.daysFromToday <= 7,
                    ).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                active
                  ? f.id === "overdue"
                    ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                    : "border-orange/60 bg-orange/15 text-orange-glow"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {f.id === "overdue" ? (
                <AlertTriangle className="size-4" />
              ) : (
                <CalendarDays className="size-4" />
              )}
              {f.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${
                  active ? "bg-white/15" : "bg-white/10 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {jobsQuery.isPending ? (
        <ul className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </ul>
      ) : jobsQuery.isError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center text-sm text-rose-200">
          Could not load your jobs. {(jobsQuery.error as Error).message}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState hasQuery={query.length > 0} filter={filter} />
      ) : (
        <ul className="space-y-3">
          {visible.map(({ job, d, progress }) => (
            <li key={job.bookingId}>
              <JobCard
                job={job}
                d={d}
                progress={progress}
                onOpenDetail={() => setDetailId(job.bookingId)}
                onOpenDiary={() => openDiary(job.bookingId)}
                onLogHours={() => setHoursJobId(job.bookingId)}
                onAddReceipt={() => setReceiptJobId(job.bookingId)}
                onComplete={() => markCompleted(job.bookingId)}
              />
            </li>
          ))}
        </ul>
      )}

      <JobDetailSheet
        detail={detail}
        detailDerived={detailDerived}
        saving={mutation.isPending}
        onClose={() => setDetailId(null)}
        onOpenDiary={openDiary}
        onLogHours={(id) => {
          setDetailId(null);
          setHoursJobId(id);
        }}
        onAddReceipt={(id) => {
          setDetailId(null);
          setReceiptJobId(id);
        }}
        onComplete={markCompleted}
        onChangeStatus={changeStatus}
        onSaveSchedule={saveSchedule}
      />

      <SiteDiarySheet open={diaryOpen} onOpenChange={setDiaryOpen} />

      <LogHoursDialog
        jobId={hoursJobId}
        job={jobs.find((j) => j.bookingId === hoursJobId) ?? null}
        onClose={() => setHoursJobId(null)}
      />
      <AddReceiptDialog
        jobId={receiptJobId}
        job={jobs.find((j) => j.bookingId === receiptJobId) ?? null}
        onClose={() => setReceiptJobId(null)}
      />
    </section>
  );
}
