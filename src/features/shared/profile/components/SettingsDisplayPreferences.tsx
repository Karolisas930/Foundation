import { Palette } from "lucide-react";

export function SettingsDisplayPreferences({
  fontSize,
  onChange,
}: {
  fontSize: string;
  onChange: (size: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Palette className="size-5" /> Display
      </h4>
      <div>
        <p className="text-sm text-slate-400 mb-2">Font Size</p>
        <input
          type="range"
          min="14"
          max="20"
          step="1"
          value={parseInt(fontSize)}
          onChange={(e) => onChange(e.target.value + "px")}
          className="w-full accent-orange"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Small</span>
          <span>Medium</span>
          <span>Large</span>
        </div>
      </div>
    </div>
  );
}
