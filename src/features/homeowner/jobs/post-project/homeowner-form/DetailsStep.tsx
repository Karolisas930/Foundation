import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, ShieldCheck } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, Field } from "@/features/homeowner/jobs/post-project/parts";
import { BudgetTimelineCard } from "@/features/homeowner/jobs/post-project/BudgetTimelineCard";
import { LanguagePreferenceCard } from "@/features/homeowner/jobs/post-project/LanguagePreferenceCard";
import type { ProjectLanguageCode } from "@/features/homeowner/jobs/post-project/project-language";

import { LazyCardFallback } from "./LazyCardFallback";

const AISpecCard = lazy(() =>
  import("@/features/homeowner/jobs/post-project/AISpecCard").then((m) => ({
    default: m.AISpecCard,
  })),
);

export interface DetailsStepProps {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  notes: string;
  setNotes: (v: string) => void;
  budget: number;
  setBudget: (v: number) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  projectLanguages: ProjectLanguageCode[];
  setProjectLanguages: React.Dispatch<React.SetStateAction<ProjectLanguageCode[]>>;
  customLanguage: string;
  setCustomLanguage: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
}

export function DetailsStep(props: DetailsStepProps) {
  const {
    mediaFiles,
    setMediaFiles,
    notes,
    setNotes,
    budget,
    setBudget,
    timeline,
    setTimeline,
    projectLanguages,
    setProjectLanguages,
    customLanguage,
    setCustomLanguage,
    consent,
    setConsent,
  } = props;

  return (
    <>
      <Suspense fallback={<LazyCardFallback label="media uploader" />}>
        <AISpecCard mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} />
      </Suspense>

      <Card
        tone={4}
        id="card_additional_notes"
        icon={<FileText className="size-4" />}
        title="Additional notes"
      >
        <Field id="notes" label="Anything else trades should know?">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Access constraints, preferred start window, materials already sourced…"
            className="intake-input min-h-28"
          />
        </Field>
      </Card>

      <BudgetTimelineCard
        budget={budget}
        setBudget={setBudget}
        timeline={timeline}
        setTimeline={setTimeline}
      />

      <LanguagePreferenceCard
        projectLanguages={projectLanguages}
        setProjectLanguages={setProjectLanguages}
        customLanguage={customLanguage}
        setCustomLanguage={setCustomLanguage}
      />

      <div className="mb-6 rounded-xl border border-slate-800/80 bg-[#1e293b]/60 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <Checkbox
            id="gdpr-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5 border-white/30 data-[state=checked]:bg-orange data-[state=checked]:border-orange"
          />
          <Label htmlFor="gdpr-consent" className="text-sm leading-6 text-slate-300">
            I agree to share my project details with verified Baden-Württemberg trades in order to
            receive bids, and I have read the{" "}
            <Link to="/" className="font-semibold text-orange underline underline-offset-2">
              privacy notice
            </Link>
            . My data is processed under GDPR and never sold to third parties.
          </Label>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="size-3.5 text-orange-glow" />
          Your details stay private until you accept a quote.
        </p>
      </div>
    </>
  );
}
