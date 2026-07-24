/**
 * MemberDetailDialog — drill-down modal showing per-staff totals, by-job
 * breakdown, by-week / by-month lists, and the full entries table with
 * per-row approve/reject/edit actions.
 */
import { useMemo } from "react";
import { ArrowLeft, Briefcase, Check, Download, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadCsv,
  fmtDate,
  startOfMonth,
  startOfWeek,
  toCSV,
  toISODate,
  type HoursRow,
  type Status,
} from "./staff-hours-utils";
import { MiniStat, RowActions, StatusBadge } from "./StaffHoursPrimitives";

export function MemberDetailDialog({
  open,
  onOpenChange,
  memberName,
  entries,
  onBack,
  onUpdateStatus,
  onEditRow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  entries: HoursRow[];
  onBack: () => void;
  onUpdateStatus: (ids: string[] | string, status: Status) => void;
  onEditRow?: (row: HoursRow) => void;
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    let total = 0;
    let approvedTotal = 0;
    let week = 0;
    let month = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    const activeDates = new Set<string>();
    const byWeek = new Map<string, number>();
    const byMonth = new Map<string, number>();
    const byJob = new Map<string, number>();
    for (const r of entries) {
      const h = Number(r.hours) || 0;
      total += h;
      if (r.status === "approved") approvedTotal += h;
      if (r.status === "pending") pendingCount++;
      else if (r.status === "approved") approvedCount++;
      else rejectedCount++;

      if (r.status !== "rejected") activeDates.add(r.work_date);
      const d = new Date(r.work_date);
      if (d >= weekStart) week += h;
      if (d >= monthStart) month += h;

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + h);

      const ws = startOfWeek(d);
      const weekKey = toISODate(ws);
      byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + h);

      const jobKey = r.job ?? "Unassigned";
      byJob.set(jobKey, (byJob.get(jobKey) ?? 0) + h);
    }
    const round = (n: number) => Math.round(n * 10) / 10;
    const avgPerDay = activeDates.size > 0 ? total / activeDates.size : 0;
    const weeks = Array.from(byWeek, ([k, v]) => ({ key: k, hours: round(v) }))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .slice(0, 8);
    const months = Array.from(byMonth, ([k, v]) => ({ key: k, hours: round(v) }))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .slice(0, 6);
    const jobs = Array.from(byJob, ([k, v]) => ({ key: k, hours: round(v) })).sort(
      (a, b) => b.hours - a.hours,
    );
    return {
      total: round(total),
      approvedTotal: round(approvedTotal),
      week: round(week),
      month: round(month),
      avgPerDay: round(avgPerDay),
      entryCount: entries.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      weeks,
      months,
      jobs,
    };
  }, [entries]);

  const jobMax = stats.jobs[0]?.hours ?? 0;

  const fmtWeekLabel = (iso: string) => {
    const d = new Date(iso);
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    return `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "2-digit" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}`;
  };
  const fmtMonthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  function exportMemberCsv() {
    const safeName = (memberName || "staff").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadCsv(toCSV(entries), `${safeName}-hours-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const pendingIds = entries.filter((r) => r.status === "pending").map((r) => r.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-white/10 bg-[#0f172a] text-slate-50">
        <DialogHeader className="space-y-3 text-left">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all staff
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-orange-500/15 text-base font-semibold text-orange-300">
                {memberName.slice(0, 1).toUpperCase() || <UserIcon className="h-5 w-5" />}
              </span>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">{memberName}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {stats.entryCount} {stats.entryCount === 1 ? "entry" : "entries"} logged
                  {" · "}
                  <span className="text-emerald-300">{stats.approvedCount} approved</span>
                  {" · "}
                  <span className="text-amber-300">{stats.pendingCount} pending</span>
                  {stats.rejectedCount > 0 ? (
                    <>
                      {" · "}
                      <span className="text-rose-300">{stats.rejectedCount} rejected</span>
                    </>
                  ) : null}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pendingIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onUpdateStatus(pendingIds, "approved")}
                  className="gap-1 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-400/30"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve all ({pendingIds.length})
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={exportMemberCsv}
                disabled={entries.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Stat cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Approved total" value={`${stats.approvedTotal} h`} accent="emerald" />
          <MiniStat label="This month" value={`${stats.month} h`} />
          <MiniStat label="This week" value={`${stats.week} h`} />
          <MiniStat
            label="Avg per day"
            value={`${stats.avgPerDay} h`}
            hint="Days with logged work"
          />
        </div>

        {/* By job breakdown (visual) */}
        <div className="mt-6">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Briefcase className="h-3.5 w-3.5" />
            Hours by job
          </h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            {stats.jobs.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-500">No entries yet.</div>
            ) : (
              <div className="space-y-2.5">
                {stats.jobs.map((j) => {
                  const pct = jobMax > 0 ? Math.max(4, Math.round((j.hours / jobMax) * 100)) : 0;
                  return (
                    <div key={j.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-200">{j.key}</span>
                        <span className="tabular-nums font-medium text-white">{j.hours} h</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* By month */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hours by month
          </h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.03]">
            {stats.months.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">No entries yet.</div>
            ) : (
              stats.months.map((m) => (
                <div
                  key={m.key}
                  className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="text-slate-300">{fmtMonthLabel(m.key)}</span>
                  <span className="tabular-nums font-medium text-white">{m.hours} h</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By week */}
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hours by week
          </h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.03]">
            {stats.weeks.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">No entries yet.</div>
            ) : (
              stats.weeks.map((w) => (
                <div
                  key={w.key}
                  className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="text-slate-300">{fmtWeekLabel(w.key)}</span>
                  <span className="tabular-nums font-medium text-white">{w.hours} h</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Entries list */}
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            All entries
          </h3>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-right text-slate-300">Hours</TableHead>
                  <TableHead className="text-slate-300">Notes</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((r) => (
                    <TableRow
                      key={r.id}
                      className={`border-white/5 ${r.status === "rejected" ? "opacity-60" : ""}`}
                    >
                      <TableCell className="text-slate-300">{fmtDate(r.work_date)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-white">
                        {Number(r.hours).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {r.notes || <span className="text-slate-500">—</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          status={r.status}
                          onChange={(s) => onUpdateStatus(r.id, s)}
                          size="xs"
                          onEdit={onEditRow ? () => onEditRow(r) : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
