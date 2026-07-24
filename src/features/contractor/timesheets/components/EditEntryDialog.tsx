/**
 * EditEntryDialog — modal used to edit a single hours entry from the
 * Staff Hours review table.
 */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, type HoursRow } from "./staff-hours-utils";

export function EditEntryDialog({
  row,
  jobOptions,
  onClose,
  onSave,
}: {
  row: HoursRow | null;
  jobOptions: string[];
  onClose: () => void;
  onSave: (patch: { hours: number; notes: string | null; job: string | null }) => Promise<void>;
}) {
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [job, setJob] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setHours(String(row.hours ?? ""));
      setNotes(row.notes ?? "");
      setJob(row.job ?? "");
    }
  }, [row]);

  const open = row !== null;

  async function handleSave() {
    const h = Number(hours);
    if (!Number.isFinite(h) || h < 0) {
      toast.error("Enter a valid number of hours");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        hours: Math.round(h * 100) / 100,
        notes: notes.trim() ? notes.trim() : null,
        job: job.trim() ? job.trim() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#0f172a] text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-white">Edit hours entry</DialogTitle>
          <DialogDescription className="text-slate-400">
            {row ? (
              <>
                {row.member_name ?? row.member_id} · {fmtDate(row.work_date)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="edit-hours" className="text-xs font-medium text-slate-300">
              Hours
            </Label>
            <Input
              id="edit-hours"
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1.5 bg-navy/40 text-white"
            />
          </div>
          <div>
            <Label htmlFor="edit-job" className="text-xs font-medium text-slate-300">
              Job / Project
            </Label>
            <Input
              id="edit-job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              list="edit-job-options"
              placeholder="e.g. Bathroom renovation"
              className="mt-1.5 bg-navy/40 text-white"
            />
            <datalist id="edit-job-options">
              {jobOptions.map((j) => (
                <option key={j} value={j} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="edit-notes" className="text-xs font-medium text-slate-300">
              Notes
            </Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional context"
              className="mt-1.5 bg-navy/40 text-white"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
