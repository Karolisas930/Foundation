/**
 * EditProjectDialog — form for updating the currently selected project's
 * brief. Saves to the database via the `updateMyProject` server function.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import type { EcosystemProject } from "@/core/demo-session";
import { updateMyProject } from "@/lib/homeowner-projects.functions";
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

export type EditDraft = {
  title: string;
  description: string;
  budget: string;
  desiredStart: string;
  city: string;
  locationZip: string;
};

export function EditProjectDialog({
  project,
  draft,
  onDraftChange,
  onClose,
  onSaved,
}: {
  project: EcosystemProject | null;
  draft: EditDraft;
  onDraftChange: (d: EditDraft) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const save = useServerFn(updateMyProject);

  return (
    <Dialog open={Boolean(project)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[color:var(--navy-deep)] text-slate-100 sm:max-w-lg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold text-white">
            Edit project
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Update the brief — matching trades will see your changes instantly.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!project) return;
            const title = draft.title.trim();
            if (title.length < 4) {
              toast.error("Project title must be at least 4 characters.");
              return;
            }
            const budgetNum = Number(draft.budget.replace(/[^\d]/g, ""));
            if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
              toast.error("Please enter a valid budget.");
              return;
            }
            setSaving(true);
            try {
              await save({
                data: {
                  id: project.id,
                  title,
                  description: draft.description.trim() || null,
                  estimatedBudget: Math.round(budgetNum),
                  city: draft.city.trim() || null,
                  locationZip: draft.locationZip.trim() || null,
                },
              });
              onSaved();
              toast.success("Project updated.");
              onClose();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save changes.");
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-4"
        >

          <div>
            <Label htmlFor="edit-title" className="text-slate-200">
              Project title
            </Label>
            <Input
              id="edit-title"
              value={draft.title}
              onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
              maxLength={120}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-description" className="text-slate-200">
              Brief / notes
            </Label>
            <Textarea
              id="edit-description"
              value={draft.description}
              onChange={(e) => onDraftChange({ ...draft, description: e.target.value })}
              rows={4}
              maxLength={2000}
              className="mt-1 min-h-24 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-budget" className="text-slate-200">
                Budget (€)
              </Label>
              <Input
                id="edit-budget"
                inputMode="numeric"
                value={draft.budget}
                onChange={(e) => onDraftChange({ ...draft, budget: e.target.value })}
                className="mt-1 border-white/10 bg-white/5 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-start" className="text-slate-200">
                Preferred start
              </Label>
              <Input
                id="edit-start"
                value={draft.desiredStart}
                onChange={(e) => onDraftChange({ ...draft, desiredStart: e.target.value })}
                placeholder="e.g. flex, asap, July"
                className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-city" className="text-slate-200">
                City
              </Label>
              <Input
                id="edit-city"
                value={draft.city}
                onChange={(e) => onDraftChange({ ...draft, city: e.target.value })}
                className="mt-1 border-white/10 bg-white/5 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-zip" className="text-slate-200">
                Postal code
              </Label>
              <Input
                id="edit-zip"
                value={draft.locationZip}
                onChange={(e) => onDraftChange({ ...draft, locationZip: e.target.value })}
                className="mt-1 border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-orange text-white hover:bg-orange/90"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
