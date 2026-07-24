/**
 * ReviewTab — the "Review & Approve" tab of the Staff Hours page.
 * Owns filter state, selection state, and the two drill-down dialogs.
 * Reads rows + mutations from useStaffHoursData.
 */
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Clock3,
  Download,
  Loader2,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  endOfMonth,
  fmtDate,
  startOfMonth,
  startOfWeek,
  toCSV,
  toISODate,
  type HoursRow,
  type SortDir,
  type SortKey,
  type Status,
} from "./staff-hours-utils";
import {
  EmptyState,
  RowActions,
  SortButton,
  StatusBadge,
  SummaryCard,
} from "./StaffHoursPrimitives";
import { StaffBarChart, WeeklyBarChart } from "./StaffHoursCharts";
import { MemberDetailDialog } from "./MemberDetailDialog";
import { EditEntryDialog } from "./EditEntryDialog";

export function ReviewTab({
  rows,
  loading,
  updateStatus,
  updateRow,
  jobOptions,
  staffOptions,
}: {
  rows: HoursRow[];
  loading: boolean;
  updateStatus: (ids: string[] | string, status: Status) => void;
  updateRow: (
    id: string,
    patch: { hours: number; notes: string | null; job: string | null },
  ) => Promise<void>;
  jobOptions: string[];
  staffOptions: { id: string; name: string }[];
}) {
  const now = new Date();
  const defaultFrom = toISODate(startOfMonth(now));
  const defaultTo = toISODate(endOfMonth(now));

  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("work_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<HoursRow | null>(null);
  const [summaryMode, setSummaryMode] = useState<"approved" | "all">("approved");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const list = rows.filter((r) => {
      if (staffFilter !== "all" && r.member_id !== staffFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const d = new Date(r.work_date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (q) {
        const hay = `${r.member_name ?? ""} ${r.notes ?? ""} ${r.job ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "hours") cmp = (a.hours || 0) - (b.hours || 0);
      else if (sortKey === "member_name")
        cmp = (a.member_name ?? "").localeCompare(b.member_name ?? "");
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.work_date).getTime() - new Date(b.work_date).getTime();
      return cmp * dir;
    });
    return list;
  }, [rows, staffFilter, statusFilter, fromDate, toDate, query, sortKey, sortDir]);

  const summary = useMemo(() => {
    const nowD = new Date();
    const monthStart = startOfMonth(nowD);
    const weekStart = startOfWeek(nowD);
    let monthApproved = 0;
    let monthAll = 0;
    let weekApproved = 0;
    let weekAll = 0;
    let pendingCount = 0;
    const staffThisMonth = new Set<string>();
    for (const r of rows) {
      const d = new Date(r.work_date);
      const h = Number(r.hours) || 0;
      if (r.status === "pending") pendingCount++;
      if (d >= monthStart) {
        monthAll += h;
        if (r.status === "approved") monthApproved += h;
        staffThisMonth.add(r.member_id);
      }
      if (d >= weekStart) {
        weekAll += h;
        if (r.status === "approved") weekApproved += h;
      }
    }
    const staffCount = staffThisMonth.size;
    const avg = staffCount > 0 ? monthApproved / staffCount : 0;
    const round = (n: number) => Math.round(n * 10) / 10;
    return {
      monthApproved: round(monthApproved),
      monthAll: round(monthAll),
      weekApproved: round(weekApproved),
      weekAll: round(weekAll),
      staffCount,
      avg: round(avg),
      pendingCount,
    };
  }, [rows]);

  const chartData = useMemo(() => {
    const nowD = new Date();
    const monthStart = startOfMonth(nowD);
    const perStaff = new Map<string, { name: string; approved: number; all: number }>();
    const perWeek = new Map<string, { approved: number; all: number }>();
    const thisWeek = startOfWeek(nowD);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisWeek);
      d.setDate(thisWeek.getDate() - i * 7);
      perWeek.set(toISODate(d), { approved: 0, all: 0 });
    }
    for (const r of rows) {
      const d = new Date(r.work_date);
      const h = Number(r.hours) || 0;
      if (d >= monthStart) {
        const name = r.member_name ?? r.member_id;
        const cur = perStaff.get(r.member_id) ?? { name, approved: 0, all: 0 };
        cur.all += h;
        if (r.status === "approved") cur.approved += h;
        perStaff.set(r.member_id, cur);
      }
      const wk = toISODate(startOfWeek(d));
      if (perWeek.has(wk)) {
        const cur = perWeek.get(wk)!;
        cur.all += h;
        if (r.status === "approved") cur.approved += h;
      }
    }
    const round = (n: number) => Math.round(n * 10) / 10;
    const staff = Array.from(perStaff.values())
      .map((s) => ({ name: s.name, approved: round(s.approved), all: round(s.all) }))
      .sort((a, b) => b.all - a.all);
    const weeks = Array.from(perWeek, ([key, v]) => ({
      key,
      approved: round(v.approved),
      all: round(v.all),
    }));
    return { staff, weeks };
  }, [rows]);

  const pendingIdsAll = useMemo(
    () => filtered.filter((r) => r.status === "pending").map((r) => r.id),
    [filtered],
  );

  const filtersActive =
    staffFilter !== "all" ||
    statusFilter !== "all" ||
    fromDate !== defaultFrom ||
    toDate !== defaultTo ||
    query.length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "member_name" || key === "status" ? "asc" : "desc");
    }
  }

  function resetFilters() {
    setStaffFilter("all");
    setStatusFilter("all");
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setQuery("");
  }

  function exportCsv() {
    downloadCsv(toCSV(filtered), `staff-hours-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-orange-400" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-orange-400" />
    );
  };

  const selectedMemberRows = useMemo(
    () =>
      selectedMemberId
        ? rows
            .filter((r) => r.member_id === selectedMemberId)
            .sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime())
        : [],
    [rows, selectedMemberId],
  );
  const selectedMemberName =
    selectedMemberRows[0]?.member_name ??
    staffOptions.find((s) => s.id === selectedMemberId)?.name ??
    selectedMemberId ??
    "";

  return (
    <>
      {/* Summary mode toggle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Summary cards show{" "}
          <span className="font-medium text-white">
            {summaryMode === "approved" ? "approved hours only" : "all logged hours"}
          </span>
        </span>
        <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSummaryMode("approved")}
            className={`rounded px-3 py-1 transition-colors ${
              summaryMode === "approved"
                ? "bg-orange-500/20 text-orange-200"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setSummaryMode("all")}
            className={`rounded px-3 py-1 transition-colors ${
              summaryMode === "all"
                ? "bg-orange-500/20 text-orange-200"
                : "text-slate-300 hover:text-white"
            }`}
          >
            All logged
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label={summaryMode === "approved" ? "Approved this month" : "Logged this month"}
          value={`${summaryMode === "approved" ? summary.monthApproved : summary.monthAll} h`}
          hint={
            summaryMode === "approved"
              ? `${summary.monthAll} h logged in total`
              : `${summary.monthApproved} h approved so far`
          }
        />
        <SummaryCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={summaryMode === "approved" ? "Approved this week" : "Logged this week"}
          value={`${summaryMode === "approved" ? summary.weekApproved : summary.weekAll} h`}
          hint={
            summaryMode === "approved"
              ? `${summary.weekAll} h logged Mon–today`
              : `${summary.weekApproved} h approved so far`
          }
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Active staff"
          value={String(summary.staffCount)}
          hint="Logged hours this month"
        />
        <SummaryCard
          icon={
            summary.pendingCount > 0 ? (
              <Clock3 className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )
          }
          label={summary.pendingCount > 0 ? "Pending review" : "Avg per staff"}
          value={summary.pendingCount > 0 ? String(summary.pendingCount) : `${summary.avg} h`}
          hint={
            summary.pendingCount > 0 ? "Entries waiting for approval" : "Approved, month-to-date"
          }
        />
      </section>

      {/* Hours Overview — simple charts */}
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-400">
            <BarChart3 className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-medium text-white">Hours overview</h2>
          <span className="text-[11px] text-slate-500">
            Approved vs total &middot;{" "}
            {summaryMode === "approved" ? "highlighting approved" : "highlighting total"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaffBarChart data={chartData.staff} highlight={summaryMode} />
          <WeeklyBarChart data={chartData.weeks} highlight={summaryMode} />
        </div>
      </section>

      {/* Filters */}
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Filters</h2>
          {filtersActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 gap-1 text-xs text-slate-300 hover:text-white"
            >
              <X className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs font-medium text-slate-400">Staff member</Label>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="mt-1.5 bg-navy/40 text-white">
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {staffOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-400">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | Status)}
            >
              <SelectTrigger className="mt-1.5 bg-navy/40 text-white">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2 md:col-span-1 lg:col-span-2">
            <div>
              <Label className="text-xs font-medium text-slate-400">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1.5 bg-navy/40 text-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-400">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1.5 bg-navy/40 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-400">Search</Label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, notes or job"
                className="bg-navy/40 pl-8 text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
          <span className="text-xs text-slate-400">
            Showing <span className="font-medium text-white">{filtered.length}</span> of{" "}
            {rows.length} entries
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => updateStatus(pendingIdsAll, "approved")}
              disabled={pendingIdsAll.length === 0}
              className="gap-1 border border-emerald-400/30 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              Approve all pending ({pendingIdsAll.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => updateStatus(pendingIdsAll, "rejected")}
              disabled={pendingIdsAll.length === 0}
              className="gap-1 border-rose-400/30 text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
            >
              <Ban className="h-3.5 w-3.5" />
              Reject all pending
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading hours…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAnyRows={rows.length > 0} onReset={resetFilters} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>
                    <SortButton
                      active={sortKey === "member_name"}
                      onClick={() => toggleSort("member_name")}
                    >
                      Staff Member {sortIcon("member_name")}
                    </SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton
                      active={sortKey === "work_date"}
                      onClick={() => toggleSort("work_date")}
                    >
                      Date {sortIcon("work_date")}
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton
                      active={sortKey === "hours"}
                      onClick={() => toggleSort("hours")}
                      className="ml-auto"
                    >
                      Hours {sortIcon("hours")}
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-slate-300">Job / Project</TableHead>
                  <TableHead className="text-slate-300">Notes</TableHead>
                  <TableHead>
                    <SortButton active={sortKey === "status"} onClick={() => toggleSort("status")}>
                      Status {sortIcon("status")}
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(r.member_id)}
                        className="inline-flex items-center gap-2 rounded-md text-left text-white underline-offset-4 hover:text-orange-300 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500/15 text-[10px] font-semibold text-orange-300">
                          {(r.member_name ?? r.member_id).slice(0, 1).toUpperCase()}
                        </span>
                        {r.member_name ?? r.member_id}
                      </button>
                    </TableCell>
                    <TableCell className="text-slate-300">{fmtDate(r.work_date)}</TableCell>
                    <TableCell className="text-right tabular-nums text-white">
                      {Number(r.hours).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {r.job ? (
                        <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-200">
                          {r.job}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-[280px] truncate text-slate-300"
                      title={r.notes ?? ""}
                    >
                      {r.notes || <span className="text-slate-500">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        status={r.status}
                        onChange={(s) => updateStatus(r.id, s)}
                        onEdit={() => setEditingRow(r)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <MemberDetailDialog
        open={selectedMemberId !== null}
        onOpenChange={(o) => !o && setSelectedMemberId(null)}
        memberName={selectedMemberName}
        entries={selectedMemberRows}
        onBack={() => setSelectedMemberId(null)}
        onUpdateStatus={updateStatus}
        onEditRow={(r) => setEditingRow(r)}
      />

      <EditEntryDialog
        row={editingRow}
        jobOptions={jobOptions}
        onClose={() => setEditingRow(null)}
        onSave={async (patch) => {
          if (!editingRow) return;
          await updateRow(editingRow.id, patch);
          setEditingRow(null);
        }}
      />
    </>
  );
}
