/**
 * CompanyAutocomplete — business name typeahead & auto-fill.
 *
 * - Live suggestions for registered businesses and trade establishments.
 * - Defaults to Germany (countrycode=de) while accepting a countryCode prop
 *   for international expansion.
 * - Selecting a suggestion emits the resolved company & address details via
 *   `onSelectCompany` to auto-populate Step 3 (Service Area).
 * - Debounced by 300ms to keep network calls minimal.
 */
import { useEffect, useRef, useState } from "react";
import { Building2, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchCompanySuggestions,
  type CompanySuggestion,
} from "@/regions";

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  countryCode?: string;
  onSelectCompany?: (company: CompanySuggestion) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  maxLength?: number;
  "aria-label"?: string;
}

const DEBOUNCE_MS = 300;

export function CompanyAutocomplete({
  id,
  value,
  onChange,
  onBlur,
  countryCode = "de",
  onSelectCompany,
  placeholder = "e.g. Müller Bau GmbH",
  className,
  invalid,
  maxLength = 120,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      const results = await fetchCompanySuggestions(trimmed, {
        countryCode,
        signal: controller.signal,
        limit: 8,
      });

      if (!controller.signal.aborted) {
        setSuggestions(results);
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, countryCode]);

  useEffect(() => {
    setActiveIdx(-1);
  }, [suggestions]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const applySuggestion = (company: CompanySuggestion) => {
    selectingRef.current = true;
    setOpen(false);
    onChange(company.name);
    onSelectCompany?.(company);
    window.setTimeout(() => {
      selectingRef.current = false;
    }, 0);
  };

  const hasResults = suggestions.length > 0;
  const showList = open && value.trim().length >= 2 && (hasResults || loading);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (selectingRef.current) return;
              setOpen(false);
            }, 120);
            onBlur?.();
          }}
          onKeyDown={(e) => {
            if (!showList) {
              if (e.key === "ArrowDown" && hasResults) {
                setOpen(true);
                e.preventDefault();
              }
              return;
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (hasResults) setActiveIdx((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (hasResults) setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter") {
              if (activeIdx >= 0 && activeIdx < suggestions.length) {
                e.preventDefault();
                applySuggestion(suggestions[activeIdx]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "intake-input mt-2 pr-9",
            invalid && "border-orange/70 ring-1 ring-orange/40",
            className,
          )}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-activedescendant={activeIdx >= 0 && id ? `${id}-option-${activeIdx}` : undefined}
          {...rest}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 pt-1 text-white/40">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange" />
          ) : (
            <Building2 className="h-4 w-4 text-white/30" />
          )}
        </div>
      </div>

      {showList && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#0d1117] py-1 text-sm text-white shadow-2xl backdrop-blur-md"
        >
          {loading && !hasResults && (
            <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange" />
              <span>Looking up registered businesses…</span>
            </li>
          )}

          {!loading && !hasResults && (
            <li className="px-3 py-2.5 text-xs text-white/50">
              No registered business found. You can keep typing manually.
            </li>
          )}

          {suggestions.map((company, i) => (
            <li
              key={`${company.id}-${i}`}
              id={id ? `${id}-option-${i}` : undefined}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(company);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "cursor-pointer px-3 py-2.5 transition-colors border-b border-white/5 last:border-b-0",
                i === activeIdx ? "bg-orange/20 text-white" : "hover:bg-white/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white truncate">{company.name}</span>
                    {company.category && (
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange uppercase tracking-wider">
                        {company.category}
                      </span>
                    )}
                  </div>
                  {company.fullAddress && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-white/40" />
                      <span className="truncate">{company.fullAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
