import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Phone,
  Receipt,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EcosystemProject } from "@/core/demo-session";
import { progressOf, statusMeta, sumHoursForJob, type Derived } from "./active-jobs-store";
import { ActionBtn, InfoTile } from "./atoms";
import { CrewTile } from "./CrewTile";

export function JobDetailSheet({
  detail,
  detailDerived,
  onClose,
  onOpenDiary,
  onLogHours,
  onAddReceipt,
  onComplete,
  onChangeStatus,
}: {
  detail: EcosystemProject | null;
  detailDerived: Derived | null;
  onClose: () => void;
  onOpenDiary: (id: string) => void;
  onLogHours: (id: string) => void;
  onAddReceipt: (id: string) => void;
  onComplete: (id: string) => void;
  onChangeStatus: (id: string, status: EcosystemProject["status"]) => void;
}) {
  return (
    <Sheet open={detail !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0f172a] p-0 text-slate-50"
      >
        <SheetTitle className="sr-only">Job details</SheetTitle>
        <SheetDescription className="sr-only">
          Details for the selected active job.
        </SheetDescription>
        {detail && detailDerived && (
          <div className="flex flex-col gap-5 px-5 pb-6 pt-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
                  {statusMeta(detail).label}
                </p>
                {detailDerived.isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                    <AlertTriangle className="size-3" />
                    Overdue
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-display text-xl font-extrabold text-white">
                {detail.title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{detail.description}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <InfoTile
                label="Scheduled"
                value={detailDerived.scheduledLabel}
                tone={
                  detailDerived.isOverdue
                    ? "text-rose-300"
                    : detailDerived.isToday
                      ? "text-orange-glow"
                      : undefined
                }
              />
              <InfoTile label="Location" value={`${detail.city ?? "—"} · ${detail.locationZip}`} />
              <InfoTile label="Trade" value={detail.trade ?? "—"} />
              <InfoTile label="Phase" value={detail.phase ?? "—"} />
              <InfoTile
                label="Budget"
                value={`€ ${detail.budgetUsed.toLocaleString("de-DE")} / ${detail.budgetTotal.toLocaleString("de-DE")}`}
              />
              <InfoTile label="Logged Hours" value={`${sumHoursForJob(detail.id).toFixed(1)} h`} />
            </dl>

            <CrewTile jobId={detail.id} defaultCrew={detailDerived.defaultStaff} />

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Progress</span>
                <span className="font-semibold text-slate-200">{progressOf(detail)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-orange-glow"
                  style={{ width: `${progressOf(detail)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Change status
              </p>
              <Select
                value={detail.status}
                onValueChange={(v) => onChangeStatus(detail.id, v as EcosystemProject["status"])}
              >
                <SelectTrigger className="h-11 rounded-full border-white/10 bg-white/[0.04] text-sm text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clarifying">Clarifying</SelectItem>
                  <SelectItem value="awarded">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Client phone
                </p>
                <p className="mt-0.5 truncate font-semibold text-white">{detailDerived.phone}</p>
              </div>
              <a
                href={`tel:${detailDerived.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-emerald-400"
              >
                <Phone className="size-4" />
                Call
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionBtn
                onClick={() => onOpenDiary(detail.id)}
                icon={<BookOpen className="size-4" />}
                label="Open Site Diary"
                primary
              />
              <ActionBtn
                onClick={() => onLogHours(detail.id)}
                icon={<Timer className="size-4" />}
                label="Log Hours"
              />
              <ActionBtn
                onClick={() => onAddReceipt(detail.id)}
                icon={<Receipt className="size-4" />}
                label="Add Receipt"
              />
              <ActionBtn
                onClick={() => onComplete(detail.id)}
                icon={<CheckCircle2 className="size-4" />}
                label="Mark Completed"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-full border-white/15 bg-white/[0.04] text-sm font-semibold text-white hover:bg-white/[0.08] hover:text-white"
            >
              <ClipboardList className="mr-2 size-4" />
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
