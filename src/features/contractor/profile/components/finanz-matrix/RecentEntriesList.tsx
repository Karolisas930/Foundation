import { Loader2, Mail, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtEUR, type ScanEntry } from "./constants";

export function RecentEntriesList({
  entries,
  reserveRatio,
  onResendInvoice,
  resendingId,
}: {
  entries: ScanEntry[];
  reserveRatio: number;
  onResendInvoice: (entry: ScanEntry) => void | Promise<void>;
  resendingId: string | null;
}) {
  return (
    <div className="mt-6 border-t border-white/10 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Recent Entries
        </h4>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {entries.length} logged
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-4 text-center text-xs text-slate-500">
          No entries yet — capture, upload or log a receipt to begin.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const d = new Date(e.ts);
            const now = new Date();
            const sameDay =
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate();
            const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            const stamp = sameDay
              ? `Today, ${hhmm}`
              : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} - ${hhmm}`;
            const reserve = e.amount * reserveRatio;
            const isInvoice = !!e.invoice;
            const isResending = resendingId === e.id;
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {e.category ? `${e.category.split(" ")[0]} ` : ""}
                    {e.vendor}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {stamp}
                    {isInvoice && e.invoice ? ` · #${e.invoice.invoiceNumber}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-white">{fmtEUR(e.amount)}</p>
                    <p className="text-[10px] font-medium text-orange">Reserve {fmtEUR(reserve)}</p>
                  </div>
                  {isInvoice ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Aktionen"
                          disabled={isResending}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 disabled:opacity-50"
                        >
                          {isResending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 border-white/10 bg-[oklch(0.18_0.02_260/0.95)] p-1 text-white backdrop-blur"
                      >
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
                          Rechnungsaktionen
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onSelect={(ev) => {
                            ev.preventDefault();
                            onResendInvoice(e);
                          }}
                          disabled={isResending}
                          className="cursor-pointer gap-2 rounded-md py-2.5 focus:bg-white/10 focus:text-white"
                        >
                          <Mail className="size-4 text-orange" />
                          <span className="text-sm font-medium">
                            Rechnung per E-Mail senden / erneut senden
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
