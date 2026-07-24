/**
 * Shared types, formatters, storage and CSV helpers for the Staff Hours page.
 * Extracted from StaffHoursPage.tsx to keep the page shell thin.
 */

export type Status = "pending" | "approved" | "rejected";

export type HoursRow = {
  id: string;
  member_id: string;
  member_name: string | null;
  work_date: string;
  hours: number;
  notes: string | null;
  created_at: string;
  job?: string | null;
  status: Status;
};

export type SortKey = "member_name" | "work_date" | "hours" | "status";
export type SortDir = "asc" | "desc";

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const r = new Date(d);
  r.setDate(d.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function statusLabel(s: Status): string {
  return s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Pending";
}

export function toCSV(rows: HoursRow[]): string {
  const header = ["Staff", "Date", "Hours", "Job", "Notes", "Status"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      esc(r.member_name ?? r.member_id),
      esc(r.work_date),
      esc(String(r.hours)),
      esc(r.job ?? "—"),
      esc(r.notes ?? ""),
      esc(statusLabel(r.status)),
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function isUuid(v: string | null | undefined): v is string {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
