/**
 * Shared project-language vocabulary used by the homeowner intake flow,
 * success screen, and dashboard. Centralised so labels/flags never drift.
 *
 * Homeowners may pick multiple languages and add a free-text "Other" entry.
 * For storage we keep a single human-readable string on the project so the
 * dashboard, success screen and matched trades all see identical wording.
 */
export type ProjectLanguageCode =
  | "en"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pl"
  | "ro"
  | "nl"
  | "pt"
  | "el"
  | "sk"
  | "cs"
  | "hu"
  | "sv"
  | "bg"
  | "da"
  | "fi"
  | "lt"
  | "lv"
  | "et"
  | "sl"
  | "ga"
  | "mt"
  | "hr"
  | "ru"
  | "uk"
  | "ar"
  | "tr"
  | "other";

export const PROJECT_LANGUAGES: Array<{ code: ProjectLanguageCode; label: string; flag: string }> =
  [
<<<<<<< HEAD
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "pl", label: "Polski", flag: "🇵🇱" },
    { code: "ro", label: "Română", flag: "🇷🇴" },
    { code: "nl", label: "Nederlands", flag: "🇳🇱" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
    { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
    { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
    { code: "cs", label: "Čeština", flag: "🇨🇿" },
    { code: "hu", label: "Magyar", flag: "🇭🇺" },
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    { code: "bg", label: "Български", flag: "🇧🇬" },
    { code: "da", label: "Dansk", flag: "🇩🇰" },
    { code: "fi", label: "Suomi", flag: "🇫🇮" },
    { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
    { code: "lv", label: "Latviešu", flag: "🇱🇻" },
    { code: "et", label: "Eesti", flag: "🇪🇪" },
    { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
    { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
    { code: "mt", label: "Malti", flag: "🇲🇹" },
    { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "uk", label: "Українська", flag: "🇺🇦" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "other", label: "Other", flag: "🌐" },
  ];
=======
  export const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
  { code: "lv", label: "Latviešu", flag: "🇱🇻" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
  { code: "mt", label: "Malti", flag: "🇲🇹" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];
>>>>>>> a8a610c8d2c27f0efe9bbbbf6871afff876a3265

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
