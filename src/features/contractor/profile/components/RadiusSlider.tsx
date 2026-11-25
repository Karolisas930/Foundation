/**
 * RadiusSlider — service-radius slider with a numeric km label.
 */
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";

interface RadiusSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function RadiusSlider({ value, onChange, min = 5, max = 250 }: RadiusSliderProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
          {t("profile.serviceRadius", "Service radius")} — <span className="text-orange-glow">{value} km</span> {t("profile.serviceRadiusSuffix", "service radius")}
        </label>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        className="profile-slider"
      />
    </div>
  );
}
