import { useState } from "react";
import { Flag } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  reportProfile,
  type ProfileReportReason,
} from "@/features/contractor/profile/profile-reports.functions";

type Reason = ProfileReportReason;

const REASON_OPTIONS: { value: Reason; label: string }[] = [
  {
    value: "unauthorized_trade",
    label: "Verdacht auf unberechtigte Handwerksausübung / Schwarzarbeit",
  },
  {
    value: "forged_documents",
    label: "Gefälschte oder unvollständige Dokumente (Meisterbrief / Versicherung)",
  },
  {
    value: "misconduct",
    label: "Unangemessenes Verhalten oder betrügerische Absichten",
  },
  {
    value: "other",
    label: "Sonstiges (Bitte im Freitextfeld beschreiben)",
  },
];

interface ReportProfileDialogProps {
  reportedId: string;
  disabled?: boolean;
}

export function ReportProfileDialog({ reportedId, disabled }: ReportProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = useServerFn(reportProfile);

  const reset = () => {
    setReason(null);
    setNotes("");
    setSubmitting(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSubmit = !!reason && !submitting && (reason !== "other" || notes.trim().length > 0);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submit({
        data: {
          reportedId,
          reason,
          notes: notes.trim() || null,
        },
      });
      toast.success("Meldung eingegangen — unser Team prüft den Betrieb.");
      setOpen(false);
      reset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Meldung fehlgeschlagen.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300/90 transition hover:bg-rose-500/[0.12] hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Profil melden"
        >
          <Flag className="size-3.5" strokeWidth={1.75} />
          Profil melden
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Diesen Betrieb melden</DialogTitle>
          <DialogDescription>
            Bitte wähle einen Grund. Deine Meldung wird vertraulich an unser Compliance-Team
            weitergeleitet.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={reason ?? ""}
          onValueChange={(v) => setReason(v as Reason)}
          className="mt-2 space-y-3"
        >
          {REASON_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`reason-${opt.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 transition hover:bg-muted/60"
            >
              <RadioGroupItem value={opt.value} id={`reason-${opt.value}`} className="mt-0.5" />
              <span className="text-sm leading-snug text-foreground">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>

        <div className="mt-4 space-y-2">
          <Label htmlFor="report-notes" className="text-sm font-medium">
            Zusätzliche Anmerkungen{" "}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="report-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Weitere Details, Kontext, Beispiele …"
            rows={4}
            maxLength={2000}
          />
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "Wird gesendet …" : "Meldung absenden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
