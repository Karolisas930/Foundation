import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, Receipt, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActiveJob } from "@/lib/active-jobs.functions";
import {
  formatEuro,
  progressOf,
  statusMeta,
  sumHoursForJob,
  type Derived,
} from "./active-jobs-store";
import { ActionBtn, InfoTile } from "./atoms";
import { CrewTile } from "./CrewTile";

/** `2026-09-18T07:30:00Z` -> `2026-09-18T07:30` for datetime-local inputs. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function JobDetailSheet({
  detail,
  detailDerived,
  saving,
  onClose,
  onOpenDiary,
  onLogHours,
  onAddReceipt,
  onComplete,
  onChangeStatus,
  onSaveSchedule,
}: {
  detail: ActiveJob | null;
  detailDerived: Derived | null;
  saving?: boolean;
  onClose: () => void;
  onOpenDiary: (id: string) => void;
  onLogHours: (id: string) => void;
  onAddReceipt: (id: string) => void;
  onComplete: (id: string) => void;
  onChangeStatus: (id: string, status: ActiveJob["status"]) => void;
  onSaveSchedule: (
    id: string,
    patch: { scheduledStart: string | null; scheduledEnd: string | null; notes: string },
  ) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!detail) return;
    setStart(toLocalInput(detail.scheduledStart));
    setEnd(toLocalInput(detail.scheduledEnd));
    setNotes(detail.notes ?? "");
  }, [detail]);

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
              <p className="mt-2 text-sm text-slate-300">Client · {detail.clientName}</p>
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
              <InfoTile label="Location" value={`${detail.city ?? "—"} · ${detail.zip ?? "—"}`} />
              <InfoTile label="Trade" value={detail.trade ?? "—"} />
              <InfoTile label="Agreed price" value={formatEuro(detail.agreedPriceCents)} />
              <InfoTile
                label="Logged Hours"
                value={`${sumHoursForJob(detail.bookingId).toFixed(1)} h`}
              />
              <InfoTile
                label="Booked"
                value={new Date(detail.createdAt).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
            </dl>

            <CrewTile jobId={detail.bookingId} defaultCrew={detailDerived.defaultStaff} />

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
                onValueChange={(v) => onChangeStatus(detail.bookingId, v as ActiveJob["status"])}
              >
                <SelectTrigger className="h-11 rounded-full border-white/10 bg-white/[0.04] text-sm text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Schedule & notes
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-slate-400">Start</Label>
                  <Input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-11 border-white/10 bg-white/[0.04] text-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-slate-400">End</Label>
                  <Input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="h-11 border-white/10 bg-white/[0.04] text-white"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-slate-400">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Access details, materials, anything the crew needs."
                  className="min-h-[70px] border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  onSaveSchedule(detail.bookingId, {
                    scheduledStart: start ? new Date(start).toISOString() : null,
                    scheduledEnd: end ? new Date(end).toISOString() : null,
                    notes,
                  })
                }
                className="h-11 rounded-full bg-orange text-sm font-bold text-slate-900 hover:bg-orange-glow"
              >
                {saving ? "Saving…" : "Save schedule"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionBtn
                onClick={() => onOpenDiary(detail.bookingId)}
                icon={<BookOpen className="size-4" />}
                label="Open Site Diary"
                primary
              />
              <ActionBtn
                onClick={() => onLogHours(detail.bookingId)}
                icon={<Timer className="size-4" />}
                label="Log Hours"
              />
              <ActionBtn
                onClick={() => onAddReceipt(detail.bookingId)}
                icon={<Receipt className="size-4" />}
                label="Add Receipt"
              />
              <ActionBtn
                onClick={() => onComplete(detail.bookingId)}
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
