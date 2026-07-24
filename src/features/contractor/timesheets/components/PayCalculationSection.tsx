/**
 * PayCalculationSection — the "Pay" tab on the Staff Hours page. Calculates
 * gross pay per staff from approved hours + hourly rate and exports CSV.
 */
import { useMemo } from "react";
import { Euro, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv, type HoursRow } from "./staff-hours-utils";
import { computeLaborCost } from "../lib/labor-rate";

export function PayCalculationSection({
  rows,
  staff,
  rates,
  onRateChange,
  loading,
}: {
  rows: HoursRow[];
  staff: { id: string; name: string }[];
  rates: Record<string, number>;
  onRateChange: (memberId: string, rate: number) => void;
  loading: boolean;
}) {
  const summary = useMemo(() => computeLaborCost(rows, staff, rates), [rows, staff, rates]);

  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "EUR" });

  function exportPayCsv() {
    const header = ["Staff", "Approved Hours", "Hourly Rate (EUR)", "Gross Pay (EUR)"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = summary.list.map((s) =>
      [esc(s.name), esc(s.hours.toFixed(2)), esc(s.rate.toFixed(2)), esc(s.gross.toFixed(2))].join(
        ",",
      ),
    );
    const totalLine = [
      esc("TOTAL"),
      esc(summary.totalHours.toFixed(2)),
      "",
      esc(summary.total.toFixed(2)),
    ].join(",");
    const csv = [header.join(","), ...lines, totalLine].join("\n");
    downloadCsv(csv, `pay-summary-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading hours…
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-400">
              <Euro className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-medium text-white">Pay calculation</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Gross pay is calculated from <span className="text-white">approved hours only</span>.
            Set an hourly rate for each staff member below.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={exportPayCsv}
          disabled={summary.list.length === 0}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export pay summary
        </Button>
      </div>

      {summary.list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
          No staff yet. Log and approve hours to prepare payroll.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Staff Name</TableHead>
                <TableHead className="text-right text-slate-300">Approved Hours</TableHead>
                <TableHead className="text-right text-slate-300">Hourly Rate (€)</TableHead>
                <TableHead className="text-right text-slate-300">Gross Pay (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.list.map((s) => (
                <TableRow key={s.id} className="border-white/5">
                  <TableCell className="font-medium text-white">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-200">
                    {s.hours.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={s.rate || ""}
                      onChange={(e) => onRateChange(s.id, Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="ml-auto h-8 w-24 bg-navy/40 text-right tabular-nums text-white"
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-white">
                    {fmtMoney(s.gross)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-white/10 bg-white/[0.03]">
                <TableCell className="font-semibold text-white">Total payable</TableCell>
                <TableCell className="text-right tabular-nums text-slate-200">
                  {summary.totalHours.toFixed(2)} h
                </TableCell>
                <TableCell />
                <TableCell className="text-right text-lg font-semibold tabular-nums text-orange-300">
                  {fmtMoney(summary.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
