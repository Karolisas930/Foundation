import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Camera,
  Clock,
  FileText,
  Receipt as ReceiptIcon,
  Sparkles,
} from "lucide-react";
import {
  useAllInvoices,
  type InvoiceEntry,
} from "@/features/contractor/profile/components/toolbelt/invoice-store";
import { useStaffActivity, type StaffActivity } from "@/features/contractor/team/staff-activity";
import { eur, relDays, relTime } from "./helpers";

const STATUS_STYLE: Record<InvoiceEntry["status"], string> = {
  draft: "bg-white/10 text-white/70",
  sent: "bg-sky-400/15 text-sky-300",
  paid: "bg-emerald-400/15 text-emerald-300",
  overdue: "bg-red-400/15 text-red-300",
};

const KIND_STYLE: Record<
  StaffActivity["kind"],
  { Icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  photo: { Icon: Camera, tint: "bg-sky-400/15 text-sky-300" },
  receipt: { Icon: ReceiptIcon, tint: "bg-emerald-400/15 text-emerald-300" },
  hours: { Icon: Clock, tint: "bg-violet-400/15 text-violet-300" },
  note: { Icon: FileText, tint: "bg-white/10 text-white/70" },
};

type Feed =
  | { kind: "invoice"; ts: number; invoice: InvoiceEntry }
  | { kind: "staff"; ts: number; activity: StaffActivity };

export function RecentActivity() {
  const invoices = useAllInvoices();
  const staff = useStaffActivity();

  const feed: Feed[] = useMemo(() => {
    const inv: Feed[] = invoices.map((i) => ({
      kind: "invoice",
      ts: i.createdAt,
      invoice: i,
    }));
    const sa: Feed[] = staff.map((a) => ({
      kind: "staff",
      ts: a.createdAt,
      activity: a,
    }));
    return [...inv, ...sa].sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [invoices, staff]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-extrabold text-white">Recent activity</h3>
        <Link
          to="/finanz"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-orange/40 hover:text-orange"
        >
          Open ledger <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {feed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-orange/70" />
          <p className="mt-2 text-xs text-white/60">
            No activity yet. Invite your team or send your first invoice.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {feed.map((item) => {
            if (item.kind === "invoice") {
              const inv = item.invoice;
              return (
                <li
                  key={`inv-${inv.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {inv.client || "Untitled client"}
                    </p>
                    <p className="truncate text-[11px] text-white/50">
                      {inv.description || "—"} · {relDays(inv.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-white">
                      {eur(inv.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </li>
              );
            }
            const a = item.activity;
            const style = KIND_STYLE[a.kind];
            const Icon = style.Icon;
            const kindLabel: Record<StaffActivity["kind"], string> = {
              photo: "Photo",
              receipt: "Receipt",
              hours: "Hours",
              note: "Note",
            };
            return (
              <li
                key={`sa-${a.id}`}
                className="flex items-center justify-between gap-3 rounded-lg py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full ${style.tint}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-semibold text-white">
                      <span className="rounded-full bg-violet-400/15 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-violet-300">
                        Team
                      </span>
                      <span className="text-orange">{a.actor}</span>
                      <span className="font-normal text-white/80">{a.message}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-white/50">
                      <span className="uppercase tracking-widest">{kindLabel[a.kind]}</span> ·{" "}
                      {relTime(a.createdAt)}
                    </p>
                  </div>
                </div>
                {a.amount != null ? (
                  <span className="shrink-0 font-mono text-[13px] font-semibold text-emerald-300">
                    {eur(a.amount)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
