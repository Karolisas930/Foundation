import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { createProject } from "./ActiveJobsPage";

export function NewJobDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [trade, setTrade] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setCity("");
      setZip("");
      setTrade("");
      setBudget("");
    }
  }, [open]);

  function submit() {
    if (!title.trim()) {
      toast.error("Give the job a title");
      return;
    }
    const b = parseFloat(budget.replace(",", ".")) || 0;
    const p = createProject({ title, city, zip, trade, budget: b });
    toast.success("New job added", {
      description: `${p.title} — opening Site Diary`,
      duration: 2500,
    });
    if (onCreated) onCreated(p.id);
    else onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#0f172a] text-slate-100">
        <DialogHeader>
          <DialogTitle>Add new job</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a job you can track alongside your booked work. The Site Diary opens
            automatically so you can add photos, notes and hours.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kitchen tiling — Weber"
              className="h-11 border-white/10 bg-white/[0.04] text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Heidelberg"
                className="h-11 border-white/10 bg-white/[0.04] text-white"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>ZIP</Label>
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="69115"
                className="h-11 border-white/10 bg-white/[0.04] text-white"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Trade</Label>
            <Input
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="Tiling, Electrical…"
              className="h-11 border-white/10 bg-white/[0.04] text-white"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Budget (EUR)</Label>
            <Input
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 4200"
              className="h-11 border-white/10 bg-white/[0.04] text-white"
            />
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
            <Plus className="mr-1.5 size-4" />
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
