import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ActiveJob } from "@/lib/active-jobs.functions";
import { useHoursForJob, useJobCrew, useLogHours } from "./use-job-crew";

export function LogHoursDialog({
  jobId,
  job,
  onClose,
}: {
  jobId: string | null;
  job: ActiveJob | null;
  onClose: () => void;
}) {
  const assigned = useJobCrew(jobId);
  const crew = useMemo(() => (job ? assigned : []), [job, assigned]);
  const recent = useHoursForJob(jobId);
  const logHoursMutation = useLogHours();

  const [staff, setStaff] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  useEffect(() => {
    if (jobId) {
      // Default to "Me" so staff can log in one tap without picking themselves.
      setStaff("Me");
      setHours("");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setShowStaffPicker(false);
    }
  }, [jobId, crew]);

  function submit() {
    if (!jobId || !job) return;
    const h = parseFloat(hours.replace(",", "."));
    if (!h || h <= 0) {
      toast.error("Enter a valid number of hours");
      return;
    }
    logHoursMutation.mutate(
      { bookingId: jobId, staff: staff || "Me", hours: h, date, note: note || null },
      {
        onSuccess: () => {
          toast.success(`${h.toFixed(1)} h logged for ${staff || "Me"}`, {
            description: job.title,
            duration: 2500,
          });
          onClose();
        },
        onError: (err: Error) => toast.error("Could not log hours", { description: err.message }),
      },
    );
  }

  const options = crew.length > 0 ? crew : ["Me"];

  return (
    <Dialog open={jobId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#0f172a] text-slate-100">
        <DialogHeader>
          <DialogTitle>Log working hours</DialogTitle>
          <DialogDescription className="text-slate-400">{job?.title ?? ""}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
            <span className="text-slate-400">
              Logging for <span className="font-semibold text-slate-100">{staff || "Me"}</span>
            </span>
            {!showStaffPicker ? (
              <button
                type="button"
                onClick={() => setShowStaffPicker(true)}
                className="font-semibold text-orange hover:text-orange-glow"
              >
                Change
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStaff("Me");
                  setShowStaffPicker(false);
                }}
                className="font-semibold text-slate-400 hover:text-slate-200"
              >
                Reset to Me
              </button>
            )}
          </div>
          {showStaffPicker && (
            <div className="grid gap-1.5">
              <Label>Staff</Label>
              <Select value={staff} onValueChange={setStaff}>
                <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Me">Me</SelectItem>
                  {options.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Hours</Label>
              <Input
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 4.5"
                className="h-11 border-white/10 bg-white/[0.04] text-white"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 border-white/10 bg-white/[0.04] text-white"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was done?"
              className="min-h-[70px] border-white/10 bg-white/[0.04] text-white"
            />
          </div>

          {recent.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300">
              <p className="mb-1 font-semibold text-slate-200">Recent logs</p>
              <ul className="space-y-0.5">
                {recent.slice(0, 3).map((h) => (
                  <li key={h.id} className="flex justify-between">
                    <span>
                      {h.date} · {h.staff}
                    </span>
                    <span className="font-semibold">{h.hours.toFixed(1)} h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={submit} className="bg-orange text-slate-900 hover:bg-orange-glow">
            Log Hours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
