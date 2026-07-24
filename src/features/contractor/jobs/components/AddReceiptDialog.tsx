import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { EcosystemProject } from "@/core/demo-session";
import { addSiteDiaryEntry, fileToDataUrl } from "@/features/contractor/team/site-diary-store";

export function AddReceiptDialog({
  jobId,
  job,
  onClose,
}: {
  jobId: string | null;
  job: EcosystemProject | null;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (jobId) {
      setLabel("");
      setAmount("");
      setFile(null);
    }
  }, [jobId]);

  async function submit() {
    if (!jobId || !job) return;
    if (!label.trim() && !file) {
      toast.error("Add a label or choose a receipt photo");
      return;
    }
    const amt = parseFloat(amount.replace(",", "."));
    const dataUrl = file ? await fileToDataUrl(file) : undefined;
    addSiteDiaryEntry({
      jobId,
      jobTitle: job.title,
      kind: "receipt",
      dataUrl,
      filename: file?.name,
      note: `${label.trim() || "Receipt"}${!isNaN(amt) ? ` — € ${amt.toFixed(2)}` : ""}`,
    });
    toast.success("Receipt attached", {
      description: `Saved to ${job.title}`,
      duration: 2500,
    });
    onClose();
  }

  return (
    <Dialog open={jobId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#0f172a] text-slate-100">
        <DialogHeader>
          <DialogTitle>Add receipt</DialogTitle>
          <DialogDescription className="text-slate-400">
            Attach a photo or note to <span className="text-white">{job?.title}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Bauhaus – tiles"
              className="h-11 border-white/10 bg-white/[0.04] text-white"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Amount (EUR)</Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 128.50"
              className="h-11 border-white/10 bg-white/[0.04] text-white"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Photo</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="h-11 justify-start gap-2 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
            >
              <Paperclip className="size-4" />
              {file ? file.name : "Take photo or choose file"}
            </Button>
          </div>
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
            Attach Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
