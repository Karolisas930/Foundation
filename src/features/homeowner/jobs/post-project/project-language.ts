/**
 * Shared project-language vocabulary used by the homeowner intake flow,
 * success screen, and dashboard. Centralised so labels/flags never drift.
 *
 * Homeowners may pick multiple languages and add a free-text "Other" entry.
 * For storage we keep a single human-readable string on the project so the
 * dashboard, success screen and matched trades all see identical wording.
 */
export type ProjectLanguageCode = "en" | "de" | "fr" | "it" | "tr" | "pl" | "ru" | "ar" | "other";

export const PROJECT_LANGUAGES: Array<{ code: ProjectLanguageCode; label: string; flag: string }> =
  [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "pl", label: "Polski", flag: "🇵🇱" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "other", label: "Other", flag: "🌐" },
  ];

/** Render a single code (legacy single-language helper, still used by parts.tsx). */
export function formatProjectLanguage(code: string | undefined): string {
  if (!code) return "—";
  const match = PROJECT_LANGUAGES.find((l) => l.code === code);
  if (!match) return code; // already a free-form label
  return `${match.flag} ${match.label}`;
}

/**
 * Render a multi-language selection + optional custom text into a single,
 * comma-separated display string. Used for both ledger storage and UI.
 */
export function formatProjectLanguages(codes: ProjectLanguageCode[], custom?: string): string {
  if (!codes.length && !custom?.trim()) return "—";
  const parts: string[] = [];
  for (const code of codes) {
    if (code === "other") continue;
    const match = PROJECT_LANGUAGES.find((l) => l.code === code);
    if (match) parts.push(`${match.flag} ${match.label}`);
  }
  if (codes.includes("other") && custom?.trim()) {
    parts.push(`🌐 ${custom.trim()}`);
  } else if (codes.includes("other")) {
    parts.push("🌐 Other");
  }
  return parts.join(" · ");
}
