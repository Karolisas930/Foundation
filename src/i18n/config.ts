/**
 * i18next setup. English-first with German keys ready as the secondary
 * bundle. The LanguageSelector switches between supported locales.
 *
 * Locale strings live in ./locales/*.json — add keys there, not here.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";

export type SupportedLang = {
  code: string;
  label: string;
  flag: string;
};

// 24 official EU languages + Swiss German (gsw), Russian, Ukrainian, Norwegian.
// Only en/de have full translation bundles; the rest fall back to English.
export const supportedLanguages: SupportedLang[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "lv", label: "Latviešu", flag: "🇱🇻" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
  { code: "mt", label: "Malti", flag: "🇲🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "gsw", label: "Schwiizertüütsch", flag: "🇨🇭" },
  { code: "nb", label: "Norsk", flag: "🇳🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
];

const resources = {
  en: { translation: en },
  de: { translation: de },
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    partialBundledLanguages: true,
    returnNull: false,
  });
}

export default i18n;
