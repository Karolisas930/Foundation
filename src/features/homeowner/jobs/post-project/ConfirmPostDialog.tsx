/**
 * ConfirmPostDialog — review-and-confirm modal shown before submitting
 * the homeowner project intake. Pure presentational; parent owns submit.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Briefcase, Calendar, Euro, Globe, MapPin, ShieldCheck } from "lucide-react";
import { formatProjectLanguages, type ProjectLanguageCode } from "./project-language";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onConfirm: () => void;
  projectTitle: string;
  trade: string;
  city: string;
  postalCode: string;
  budget: number;
  startDate: string;
  timeline: string;
  projectLanguages: ProjectLanguageCode[];
  customLanguage: string;
};

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-orange/15 text-orange-glow">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

export function ConfirmPostDialog({
  open,
  onOpenChange,
  submitting,
  onConfirm,
  projectTitle,
  trade,
  city,
  postalCode,
  budget,
  startDate,
  timeline,
  projectLanguages,
  customLanguage,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-slate-800 bg-[#0f172a] text-slate-50">
        <AlertDialogHeader>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
            Final review
          </p>
          <AlertDialogTitle className="mt-1 text-xl text-white">
            {projectTitle || "Untitled project"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            Confirm the details below — this is what verified trades will see when they bid on your
            project.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-2 grid gap-2">
          <Row icon={<Briefcase className="size-3.5" />} label="Trade" value={trade || "—"} />
          <Row
            icon={<MapPin className="size-3.5" />}
            label="Location"
            value={
              <>
                {city || "—"}
                {postalCode ? <span className="text-slate-400"> · {postalCode}</span> : null}
              </>
            }
          />
          <Row
            icon={<Euro className="size-3.5" />}
            label="Budget"
            value={`€ ${budget.toLocaleString("de-DE")}`}
          />
          <Row
            icon={<Calendar className="size-3.5" />}
            label="Preferred start"
            value={startDate ? startDate : timeline ? timeline.toUpperCase() : "Flexible"}
          />
          <Row
            icon={<Globe className="size-3.5" />}
            label="Languages"
            value={formatProjectLanguages(projectLanguages, customLanguage)}
          />
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5 text-[12px] leading-5 text-emerald-100">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          Your contact details stay private until you accept a quote. We'll email you a magic
          sign-in link so you can manage bids from your dashboard.
        </p>

        <AlertDialogFooter className="mt-2 gap-2">
          <AlertDialogCancel
            disabled={submitting}
            className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
          >
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={submitting}
            className="bg-orange font-semibold text-white hover:bg-orange/90"
          >
            {submitting ? "Posting…" : "Confirm & post"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
