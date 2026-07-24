/**
 * ServiceAreaSection — service radius slider with numeric input.
 */
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SectionShell } from "./SectionShell";

interface Props {
  editing: boolean;
  radius: number[];
  setRadius: (v: number[]) => void;
  onDirty: () => void;
}

export function ServiceAreaSection({ editing, radius, setRadius, onDirty }: Props) {
  return (
    <SectionShell
      id="section-area"
      icon={MapPin}
      eyebrow="Step 3"
      title="Service Area"
      subtitle="How far you travel from your home base for jobs."
    >
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Einsatzradius — {radius[0]} km
        </Label>
        <div className="mt-3 flex items-center gap-3">
          <Slider
            min={1}
            max={300}
            step={1}
            value={radius}
            onValueChange={(v) => {
              setRadius(v);
              onDirty();
            }}
            disabled={!editing}
            className="flex-1"
          />
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              value={radius[0]}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const parsed = parseInt(raw, 10);
                if (Number.isNaN(parsed)) return;
                const clamped = Math.min(300, Math.max(1, parsed));
                setRadius([clamped]);
                onDirty();
              }}
              readOnly={!editing}
              className="intake-input h-11 w-20 text-center text-base font-semibold"
              aria-label="Service radius in kilometres"
            />
            <span className="text-sm font-medium text-slate-400">km</span>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
