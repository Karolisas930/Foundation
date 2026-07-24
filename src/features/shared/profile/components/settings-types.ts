export const SETTINGS_STORAGE_KEY = "handwerk.settings.v1";

export type PersistedSettings = {
  steuernummer: string;
  iban: string;
  bankName: string;
  website: string;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  language: string;
  publicListing: boolean;
  jobAlerts: boolean;
  weeklyDigest: boolean;
  kleinunternehmer: boolean;
  rechtsform: string;
  fontSize: string;
};

export const SETTINGS_DEFAULTS: PersistedSettings = {
  steuernummer: "",
  iban: "",
  bankName: "",
  website: "",
  socialInstagram: "",
  socialFacebook: "",
  socialLinkedin: "",
  language: "en",
  publicListing: true,
  jobAlerts: true,
  weeklyDigest: true,
  kleinunternehmer: false,
  rechtsform: "einzelunternehmer",
  fontSize: "16px",
};

export const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "sr", label: "Srpski", flag: "🇷🇸" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

export function loadSettings(): PersistedSettings {
  if (typeof window === "undefined") return SETTINGS_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return SETTINGS_DEFAULTS;
    return { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return SETTINGS_DEFAULTS;
  }
}

export type SettingsUpdater = <K extends keyof PersistedSettings>(
  key: K,
  value: PersistedSettings[K],
) => void;
