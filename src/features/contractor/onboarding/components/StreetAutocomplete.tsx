/**
 * StreetAutocomplete — postcode-scoped street lookup.
 *
 * - Suggestions come from Nominatim via `fetchStreetSuggestions`, strictly
 *   filtered to the entered 5-digit German postal code. No large arrays
 *   ship in the client bundle.
 * - Keystrokes are debounced by 300ms so the network stays quiet while
 *   the user is typing.
 * - Picking a suggestion emits the fully resolved address object via
 *   `onSelectAddress` so parent screens (onboarding, profile, homeowner
 *   wizard, "Voice to Invoice") can sync their global state at once
 *   without the user re-typing anything.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchStreetSuggestions, type StreetSuggestion } from "@/regions";
import { fetchStreetsOpenPLZ } from "@/regions";

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  postalCode?: string;
  /**
   * Called when the user picks a suggestion — receives the fully
   * verified address (postcode, city, state, street[, houseNumber]).
   */
  onSelectAddress?: (address: StreetSuggestion) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  required?: boolean;
  maxLength?: number;
  "aria-label"?: string;
};

const DEBOUNCE_MS = 300;

// Split "Rotebühlstraße 42" into the street name and any trailing house-
// number token so picking a suggestion never wipes what the user typed.
export function splitStreetAndNumber(input: string): { street: string; tail: string } {
  const m = input.match(/^(.*?)(\s+\d.*)?$/);
  if (!m) return { street: input, tail: "" };
  return { street: (m[1] ?? "").trim(), tail: m[2] ?? "" };
}

/** Compose the input value after the user picks a street suggestion. */
export function composeStreetSelection(currentValue: string, suggestion: StreetSuggestion): string {
  const { tail } = splitStreetAndNumber(currentValue);
  return tail ? `${suggestion.name}${tail}` : `${suggestion.name} `;
}

export function StreetAutocomplete({
  id,
  value,
  onChange,
  onBlur,
  postalCode,
  onSelectAddress,
  placeholder = "e.g. Hauptstraße 42",
  className,
  invalid,
  required,
  maxLength = 200,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectingRef = useRef(false);

  const streetQuery = useMemo(() => splitStreetAndNumber(value).street, [value]);
  const plzValid = /^\d{5}$/.test(postalCode ?? "");

  // Debounced, aborted-on-change Nominatim lookup.
  useEffect(() => {
    if (!plzValid || streetQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      // Prefer OpenPLZ (official German postal data). Fall back to
      // Nominatim if it returns nothing or errors out so users always
      // get suggestions when available.
      let results = await fetchStreetsOpenPLZ(streetQuery, postalCode ?? "", {
        signal: controller.signal,
        limit: 8,
      });
      if (!results.length && !controller.signal.aborted) {
        results = await fetchStreetSuggestions(streetQuery, postalCode ?? "", {
          signal: controller.signal,
          limit: 8,
        });
      }
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [streetQuery, postalCode, plzValid]);

  useEffect(() => {
    setActiveIdx(-1);
  }, [suggestions]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const applySuggestion = (s: StreetSuggestion) => {
    const next = composeStreetSelection(value, s);
    selectingRef.current = true;
    setOpen(false);
    onChange(next);
    onSelectAddress?.(s);
    window.setTimeout(() => {
      selectingRef.current = false;
    }, 0);
  };

  const hasResults = suggestions.length > 0;
  const showList = open && (hasResults || loading || (plzValid && streetQuery.length >= 2));

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        autoComplete="street-address"
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a suggestion can register first.
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
          "intake-input mt-2",
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
      {showList && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-64 overflow-auto rounded-md border border-white/10 bg-slate-900/95 py-1 text-sm text-white shadow-lg backdrop-blur"
        >
          {!plzValid && (
            <li className="px-3 py-2 text-xs text-white/60">
              Enter your 5-digit Postleitzahl first to load streets.
            </li>
          )}
          {plzValid && loading && !hasResults && (
            <li className="px-3 py-2 text-xs text-white/60">Searching…</li>
          )}
          {plzValid && !loading && !hasResults && streetQuery.length >= 2 && (
            <li className="px-3 py-2 text-xs text-white/60">
              No streets found for PLZ {postalCode}.
            </li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={`${s.name}-${i}`}
              id={id ? `${id}-option-${i}` : undefined}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "cursor-pointer px-3 py-2 transition-colors",
                i === activeIdx ? "bg-orange/20 text-white" : "hover:bg-white/5",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{s.name}</span>
                {s.city && (
                  <span className="text-[11px] text-white/50">
                    {s.postcode} {s.city}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
