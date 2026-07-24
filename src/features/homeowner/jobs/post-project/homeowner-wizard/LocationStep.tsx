import { Check, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LocationStep({
  value,
  onChange,
  city,
  onAdvance,
}: {
  value: string;
  onChange: (v: string) => void;
  city: string | null;
  onAdvance: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <label
        htmlFor="plz"
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400"
      >
        German postal code
      </label>

      <div className="relative w-full max-w-xs">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-orange-glow" />
        <Input
          id="plz"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="\d{5}"
          maxLength={5}
          value={value}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, "").slice(0, 5);
            onChange(clean);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.length === 5) {
              e.preventDefault();
              onAdvance();
            }
          }}
          placeholder="69115"
          aria-label="Postal code"
          className="h-16 rounded-2xl border-white/15 bg-[#0f172a]/80 pl-12 text-center font-display text-2xl font-bold tracking-[0.35em] text-white placeholder:text-slate-600 focus-visible:border-orange/60 focus-visible:ring-orange/30"
        />
      </div>

      <div
        className={cn(
          "min-h-10 text-center text-sm transition-opacity",
          city ? "text-slate-200 opacity-100" : "text-slate-500 opacity-70",
        )}
        aria-live="polite"
      >
        {city ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-orange-glow">
            <Check className="size-3.5" />
            {city}
          </span>
        ) : value.length > 0 && value.length < 5 ? (
          <>Enter all 5 digits…</>
        ) : (
          <>We support all German PLZ — Baden-Württemberg trades respond fastest.</>
        )}
      </div>
    </div>
  );
}
