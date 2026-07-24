import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

import { supportedLanguages } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

/**
 * Global language selector. Uses a native HTML <select> element so every
 * language option is handled by the browser's own interaction layer —
 * completely immune to touch freezes, z-index traps, or overflow clipping.
 * Missing translation keys still fall back to English via i18next's
 * fallbackLng + partialBundledLanguages config (see src/i18n/config.ts).
 */
export function LanguageSelector({ className, compact = false }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const current = (i18n as any).resolvedLanguage ?? i18n.language ?? "en";

  const currentLang = supportedLanguages.find((l) => l.code === current) ?? supportedLanguages[0];
  const currentThree =
    currentLang.code === "en"
      ? "ENG"
      : currentLang.code === "de"
        ? "DEU"
        : currentLang.code.toUpperCase().slice(0, 3);

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
      data-current-lang={currentThree}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-2.5 flex items-center gap-1.5 text-sm font-bold tracking-wide text-white sm:left-3",
          compact ? "" : "left-3",
        )}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span>{currentThree}</span>
      </span>
      <select
        style={{ color: "transparent", textShadow: "0 0 0 transparent" }}
        aria-label={t("language")}
        value={current}
        onChange={(e) => {
          const nextLang = e.target.value;
          i18n.changeLanguage(nextLang);
          document.documentElement.lang = nextLang;
          document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
        }}
        className={cn(
          "h-10 appearance-none rounded-full border border-orange/50 bg-white/10 text-sm font-bold tracking-wide text-transparent shadow-sm transition-colors",
          "hover:bg-orange/20 hover:border-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange",
          compact ? "pl-12 pr-7 w-[96px] sm:w-[112px] sm:pl-14 sm:pr-8" : "pl-14 pr-10 w-[140px]",
        )}
      >
        {supportedLanguages.map((lang) => {
          const threeLetter =
            lang.code === "en"
              ? "ENG"
              : lang.code === "de"
                ? "DEU"
                : lang.code.toUpperCase().slice(0, 3);
          return (
            <option key={lang.code} value={lang.code} className="text-foreground">
              {compact ? `${lang.flag} ${threeLetter}` : `${lang.flag} ${lang.label}`}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute size-4 shrink-0 text-orange",
          compact ? "right-2 sm:right-2.5" : "right-3",
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export default LanguageSelector;
