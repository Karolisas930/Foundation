/**
 * LanguageGrid — searchable multi-column grid of language pill choices,
 * used by the Profile step of the HandymanOnboarding flow.
 */
import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AVAILABLE_LANGUAGES } from "./onboarding-constants";

interface LanguageGridProps {
  languages: typeof AVAILABLE_LANGUAGES;
  selected: string[];
  onToggle: (code: string) => void;
}

export function LanguageGrid({ languages, selected, onToggle }: LanguageGridProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return languages;
    return languages.filter(
      (l) => l.label.toLowerCase().includes(term) || l.code.toLowerCase().includes(term),
    );
  }, [q, languages]);

  return (
    <div className="mt-2 space-y-3">
      <div className="sticky top-[112px] z-10 rounded-xl border border-white/10 bg-[#0f172a]/95 p-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search languages…"
            className="intake-input pl-9"
            aria-label="Search languages"
          />
        </div>
      </div>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        role="listbox"
        aria-multiselectable="true"
      >
        {filtered.map((l) => {
          const isSelected = selected.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onToggle(l.code)}
              className={cn(
                "inline-flex items-center justify-between gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? "border-orange/60 bg-orange/10 text-white ring-2 ring-orange/40"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25",
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden>{l.flag}</span>
                <span className="truncate">{l.label}</span>
              </span>
              {isSelected && <CheckCircle2 className="size-3.5 shrink-0 text-orange-glow" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-400">
            No languages match “{q}”.
          </p>
        )}
      </div>
    </div>
  );
}
