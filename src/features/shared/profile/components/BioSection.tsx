/**
 * BioSection — short business bio textarea on the intake-input surface.
 */
import { cn } from "@/lib/utils";

interface BioSectionProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function BioSection({
  value,
  onChange,
  label = "Short Business Bio",
  placeholder = "Tell homeowners what you do, your experience and what sets you apart.",
  rows = 4,
}: BioSectionProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
        className={cn(
          "block w-full resize-y rounded-xl border px-4 py-3 text-base font-medium text-white placeholder:text-white/40 outline-none transition focus:border-orange/60 focus:ring-2 focus:ring-orange/30",
        )}
      />
    </div>
  );
}
