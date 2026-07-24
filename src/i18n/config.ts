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

export const supportedLanguages: SupportedLang[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
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
