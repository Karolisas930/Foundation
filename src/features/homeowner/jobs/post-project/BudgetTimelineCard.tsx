/**
 * BudgetTimelineCard — estimated budget (slider + free numeric input),
 * preferred-start dropdown, and free-form budget notes (sent via FormData
 * under `budgetNotes`).
 */
import { Wallet } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
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
import { Card, Field } from "./parts";

const SLIDER_MIN = 500;
const SLIDER_MAX = 100000;
const SLIDER_STEP = 500;

export function BudgetTimelineCard({
  budget,
  setBudget,
  timeline,
  setTimeline,
}: {
  budget: number;
  setBudget: (v: number) => void;
  timeline: string;
  setTimeline: (v: string) => void;
}) {
  const sliderValue = Math.min(Math.max(budget, SLIDER_MIN), SLIDER_MAX);
  const pct = ((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <Card
      tone={5}
      id="card_budget_timeline"
      icon={<Wallet className="size-4" />}
      title="Budget & timeline"
    >
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <Label htmlFor="budget-input" className="text-sm font-medium text-white">
              Estimated budget
            </Label>
            <span className="font-display text-xl font-bold tabular-nums tracking-tight text-orange">
              <span className="mr-0.5">€</span>
              {budget.toLocaleString("de-DE")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <SliderPrimitive.Root
              aria-label="Budget slider"
              value={[sliderValue]}
              onValueChange={(v) => setBudget(v[0] ?? 0)}
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={SLIDER_STEP}
              className="relative flex flex-1 touch-none select-none items-center py-3"
            >
              <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-700/60">
                <SliderPrimitive.Range
                  className="absolute h-full rounded-full bg-gradient-to-r from-orange to-orange-glow transition-[width] duration-150 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orange bg-white shadow-md outline-none transition-transform duration-150 ease-out hover:scale-110 focus-visible:ring-4 focus-visible:ring-orange/25 active:scale-95" />
            </SliderPrimitive.Root>

            <div className="relative shrink-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                €
              </span>
              <Input
                id="budget-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                step={100}
                value={budget === 0 ? "" : String(budget)}
                onChange={(e) => {
                  // Strip everything non-numeric, then remove any leading zeros so
                  // typing "520" while the field shows "0" doesn't produce "0520"
                  // and break the 100€ step interval.
                  const cleaned = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
                  const n = cleaned === "" ? 0 : Number(cleaned);
                  setBudget(Number.isFinite(n) && n >= 0 ? n : 0);
                }}
                placeholder="Exact"
                className="intake-input w-36 pl-8 text-right tabular-nums transition-colors"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Drag for a quick estimate or type any exact amount — no hard limit.
          </p>
        </div>

        <Field id="timeline" label="Preferred start">
          <Select value={timeline} onValueChange={setTimeline}>
            <SelectTrigger id="timeline" className="intake-input">
              <SelectValue placeholder="Select a timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">As soon as possible</SelectItem>
              <SelectItem value="2-4w">In 2–4 weeks</SelectItem>
              <SelectItem value="1-3m">In 1–3 months</SelectItem>
              <SelectItem value="flex">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field id="budgetNotes" label="Budget expectations or notes">
          <Textarea
            id="budgetNotes"
            name="budgetNotes"
            rows={2}
            maxLength={500}
            placeholder="e.g. around 15k, flexible for quality, materials already sourced…"
            className="intake-input min-h-16"
          />
        </Field>
      </div>
    </Card>
  );
}
