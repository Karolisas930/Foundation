/**
 * LanguagesSelector — flag chips with removable "x" buttons and an add-popover.
 * Themed to match the dark navy + orange palette (glass chips, orange hover).
 */
import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AVAILABLE_LANGUAGES } from "@/features/contractor/onboarding/components/profile-types";

interface LanguagesSelectorProps {
  selected: string[];
  onToggle: (code: string) => void;
}

export function LanguagesSelector({ selected, onToggle }: LanguagesSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = AVAILABLE_LANGUAGES.filter((l) => selected.includes(l.code));
  const remaining = AVAILABLE_LANGUAGES.filter((l) => !selected.includes(l.code));

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
        Languages Spoken
      </label>
      <p className="text-sm text-white/55">Pick every language you can speak with clients.</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {active.map((l) => (
          <span
            key={l.code}
            className="chip-glow inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white"
          >
            <span aria-hidden>{l.flag}</span>
            {l.label}
            <button
              type="button"
              onClick={() => onToggle(l.code)}
              className="ml-1 text-white/55 transition hover:text-white"
              aria-label={`Remove ${l.label}`}
            >
              ×
            </button>
          </span>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={remaining.length === 0}
              className="grid size-8 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/70 transition hover:border-orange/50 hover:text-orange-glow disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add language"
            >
              <Plus className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="grid gap-1">
              {remaining.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">All languages added.</p>
              )}
              {remaining.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    onToggle(l.code);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-accent"
                >
                  <span aria-hidden>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
