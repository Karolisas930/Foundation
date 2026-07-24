/**
 * LanguagePreferenceCard — popover-based multi-select for the homeowner's
 * preferred project languages, plus an optional custom language input.
 * Now styled consistently with the other intake cards using the shared
 * <Card /> and <Field /> primitives.
 */
import { ChevronDown, Info, Languages } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Card, Field } from "./parts";
import { PROJECT_LANGUAGES, type ProjectLanguageCode } from "./project-language";

type Props = {
  projectLanguages: ProjectLanguageCode[];
  setProjectLanguages: (next: ProjectLanguageCode[]) => void;
  customLanguage: string;
  setCustomLanguage: (next: string) => void;
};

export function LanguagePreferenceCard({
  projectLanguages,
  setProjectLanguages,
  customLanguage,
  setCustomLanguage,
}: Props) {
  const toggle = (code: ProjectLanguageCode) => {
    if (projectLanguages.includes(code)) {
      const next = projectLanguages.filter((c) => c !== code);
      if (code === "other") setCustomLanguage("");
      setProjectLanguages(next);
    } else {
      setProjectLanguages([...projectLanguages, code]);
    }
  };

  const hasSelection = projectLanguages.length > 0;

  return (
    <Card
      id="card_language_preference"
      icon={<Languages className="size-4" />}
      title="Preferred language"
      subtitle="Choose the languages you want trades to communicate in."
      headerAction={
        hasSelection ? (
          <button
            type="button"
            onClick={() => {
              setProjectLanguages([]);
              setCustomLanguage("");
            }}
            className="text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Clear
          </button>
        ) : null
      }
    >
      <Field
        id="project-languages"
        label="Project languages"
        icon={
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Why we ask for your preferred language"
                className="inline-flex size-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
              >
                <Info className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="max-w-xs rounded-xl border border-orange/30 bg-[color:var(--navy-deep)]/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-slate-100 shadow-2xl backdrop-blur"
            >
              This helps match you with trades who speak the same language for smoother
              communication (German, English, or other).
            </PopoverContent>
          </Popover>
        }
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              id="project-languages"
              className="intake-input flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {projectLanguages.length === 0 ? (
                  <span className="text-slate-400">Select languages…</span>
                ) : (
                  PROJECT_LANGUAGES.filter((l) => projectLanguages.includes(l.code)).map((l) => (
                    <span
                      key={l.code}
                      className="inline-flex items-center gap-1 rounded-full border border-orange/50 bg-orange/15 px-2 py-0.5 text-xs font-medium text-orange-glow"
                    >
                      <span aria-hidden>{l.flag}</span>
                      {l.label}
                    </span>
                  ))
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[color:var(--navy-deep)]/95 p-1.5 text-slate-100 shadow-2xl backdrop-blur"
          >
            <ul className="max-h-72 overflow-y-auto">
              {PROJECT_LANGUAGES.map((lang) => {
                const active = projectLanguages.includes(lang.code);
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      onClick={() => toggle(lang.code)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-orange/20 text-orange-glow"
                          : "text-slate-200 hover:bg-white/5",
                      )}
                    >
                      <Checkbox
                        checked={active}
                        tabIndex={-1}
                        className="pointer-events-none border-white/30 data-[state=checked]:bg-orange data-[state=checked]:border-orange"
                      />
                      <span aria-hidden>{lang.flag}</span>
                      <span className="flex-1">{lang.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </Field>

      {projectLanguages.includes("other") && (
        <div className="mt-4">
          <Input
            id="custom-language"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Custom language (e.g. Tagalog, Ukrainian…)"
            className="intake-input h-9 w-full text-sm sm:max-w-[320px]"
            maxLength={60}
            aria-label="Custom language"
          />
        </div>
      )}
    </Card>
  );
}
