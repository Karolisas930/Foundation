/**
 * SettingsPanel — thin coordinator. Owns the persisted settings state and
 * delegates rendering to focused child modules in this directory.
 */
import { useEffect, useState } from "react";

import { SettingsAccountSecurity } from "./SettingsAccountSecurity";
import { SettingsBusinessDocuments } from "./SettingsBusinessDocuments";
import { SettingsDangerZone } from "./SettingsDangerZone";
import { SettingsDisplayPreferences } from "./SettingsDisplayPreferences";
import { SettingsNotificationToggles } from "./SettingsNotificationToggles";
import {
  SETTINGS_DEFAULTS,
  SETTINGS_STORAGE_KEY,
  loadSettings,
  type PersistedSettings,
} from "./settings-types";

export function SettingsPanel() {
  const [s, setS] = useState<PersistedSettings>(SETTINGS_DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setS(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
    } catch {
      // ignore quota errors
    }
  }, [s, hydrated]);

  function update<K extends keyof PersistedSettings>(key: K, value: PersistedSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  const changeFontSize = (size: string) => {
    update("fontSize", size);
    document.documentElement.style.fontSize = size;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="font-display text-lg font-bold text-white">Settings</h3>
      </div>

      <SettingsAccountSecurity />
      <SettingsNotificationToggles s={s} update={update} />
      <SettingsBusinessDocuments s={s} update={update} />
      <SettingsDisplayPreferences fontSize={s.fontSize} onChange={changeFontSize} />
      <SettingsDangerZone />
    </div>
  );
}

export default SettingsPanel;
