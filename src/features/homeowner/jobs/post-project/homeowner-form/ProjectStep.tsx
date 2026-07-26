import { lazy, Suspense } from "react";
import { FileText, Hammer } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Card,
  Field,
  TradeDetailsFields,
  type TradeDetails,
} from "@/features/homeowner/jobs/post-project/parts";
import { TradeAccordion } from "@/features/homeowner/jobs/post-project/parts/TradeAccordion";
import { TRADE_CATEGORIES } from "@/regions/country-data";
import { applyVoiceFields as mergeVoiceFields } from "@/features/homeowner/jobs/post-project/apply-voice-fields";

import { LazyCardFallback } from "./LazyCardFallback";

const QuickVoiceCard = lazy(() =>
  import("@/features/homeowner/jobs/post-project/QuickVoiceCard").then((m) => ({
    default: m.QuickVoiceCard,
  })),
);

export interface ProjectStepProps {
  projectTitle: string;
  setProjectTitle: (v: string) => void;
  trade: string;
  setTrade: (v: string) => void;
  tradeDetails: TradeDetails;
  setTradeDetails: React.Dispatch<React.SetStateAction<TradeDetails>>;
  notes: string;
  setNotes: (v: string) => void;
  budget: number;
  setBudget: (v: number) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  setAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ProjectStep(props: ProjectStepProps) {
  const {
    projectTitle,
    setProjectTitle,
    trade,
    setTrade,
    tradeDetails,
    setTradeDetails,
    notes,
    setNotes,
    budget,
    setBudget,
    timeline,
    setTimeline,
    postalCode,
    setPostalCode,
    city,
    setCity,
    setAudioUrl,
  } = props;

  const updateTradeDetails = (patch: Partial<TradeDetails>) =>
    setTradeDetails((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <Suspense fallback={<LazyCardFallback label="voice intake" />}>
        <QuickVoiceCard
          onAudioCaptured={(blob) => {
            setAudioUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return URL.createObjectURL(blob);
            });
          }}
          applyFields={(fields, transcript) =>
            mergeVoiceFields(fields, transcript, {
              projectTitle,
              setProjectTitle,
              trade,
              setTrade,
              setBudget,
              timeline,
              setTimeline,
              postalCode,
              setPostalCode,
              city,
              setCity,
              notes,
              setNotes,
            })
          }
        />
      </Suspense>

      <Card
        tone={1}
        id="card_project_title"
        icon={<FileText className="size-4" />}
        title="Project title"
      >
        <Field id="projectTitle" label="What needs doing?" required>
          <Input
            id="projectTitle"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            maxLength={120}
            placeholder="Replace garden wall & pour new foundation"
            className="intake-input"
          />
        </Field>
      </Card>

      <Card
        tone={2}
        id="card_trade_grid"
        icon={<Hammer className="size-4" />}
        title="Which trade do you need?"
        subtitle="Tap the closest match — you can refine details next."
      >
        <TradeAccordion
          categories={TRADE_CATEGORIES}
          customTrades={[]}
          selected={trade ? [trade] : []}
          search=""
          onToggle={(next) => {
            setTrade(next);
            setTradeDetails({});
          }}
        />

        {trade && (
          <div className="mt-5 rounded-lg border border-slate-800 bg-[#0f172a]/60 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-glow">
              Selected: <span className="text-white">{trade}</span>
            </p>
            <TradeDetailsFields trade={trade} details={tradeDetails} update={updateTradeDetails} />
          </div>
        )}
      </Card>
    </>
  );
}
