/**
 * Editable review card: user tweaks the AI-extracted draft, then commits
 * it into the parent HomeownerForm.
 */
import { CheckCircle2, Clock, Euro, Pencil, RefreshCw, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRADE_OPTIONS } from "@/regions";
import { URGENCY_LABELS, type StructuredDraft, type UrgencyKey } from "./types";

export function DraftReviewPanel({
  draft,
  applied,
  transcript,
  onUpdate,
  onCommit,
  onReset,
}: {
  draft: StructuredDraft;
  applied: boolean;
  transcript: string;
  onUpdate: <K extends keyof StructuredDraft>(key: K, value: StructuredDraft[K]) => void;
  onCommit: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/[0.08] to-transparent p-4 shadow-[0_0_30px_-12px_rgba(52,211,153,0.4)]">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 ring-2 ring-emerald-400/40">
          <CheckCircle2 className="size-5 text-emerald-300" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            Got it
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {draft.title || "AI understood your project"}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-200/80">
            <Pencil className="size-3" />
            Review or edit any field, then apply to the form below.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-glow">
            <Sparkles className="mr-1 inline size-3" /> Title
          </Label>
          <Input
            value={draft.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="Short project title"
            className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50 placeholder:text-slate-500"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-glow">
            Description
          </Label>
          <Textarea
            value={draft.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={4}
            placeholder="What needs doing?"
            className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50 placeholder:text-slate-500"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-glow">
              <Wrench className="mr-1 inline size-3" /> Trade / sector
            </Label>
            <Select value={draft.trade || undefined} onValueChange={(v) => onUpdate("trade", v)}>
              <SelectTrigger className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50">
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {TRADE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-glow">
              <Clock className="mr-1 inline size-3" /> Urgency
            </Label>
            <Select
              value={draft.urgency || undefined}
              onValueChange={(v) => onUpdate("urgency", v as UrgencyKey)}
            >
              <SelectTrigger className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50">
                <SelectValue placeholder="Select urgency" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(URGENCY_LABELS) as UrgencyKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {URGENCY_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-glow">
            <Euro className="mr-1 inline size-3" /> Estimated budget range (€)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.budgetMin}
              onChange={(e) => onUpdate("budgetMin", e.target.value)}
              placeholder="Min"
              className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50 placeholder:text-slate-500"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.budgetMax}
              onChange={(e) => onUpdate("budgetMax", e.target.value)}
              placeholder="Max"
              className="border-white/10 bg-[color:var(--navy-deep)]/80 text-slate-50 placeholder:text-slate-500"
            />
          </div>
        </div>

        {transcript && (
          <details className="rounded-lg bg-[color:var(--navy-deep)]/60 p-2 text-[11px] text-slate-300">
            <summary className="cursor-pointer text-slate-400">Show original transcript</summary>
            <p className="mt-2 italic leading-5">“{transcript}”</p>
          </details>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={onCommit}
          className="btn-glow btn-glow-hover h-11 flex-1 rounded-xl text-sm font-bold"
        >
          <CheckCircle2 className="mr-2 size-4" />
          {applied ? "Update form" : "Use these details"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-11 rounded-xl border-orange/40 bg-orange/10 text-sm font-semibold text-orange-glow hover:bg-orange/20 hover:text-orange-glow"
        >
          <RefreshCw className="mr-2 size-4" />
          Re-record
        </Button>
      </div>
      {applied && (
        <p className="mt-2 text-center text-[11px] text-emerald-300">
          Applied to the form below — scroll down to review & post.
        </p>
      )}
    </div>
  );
}
