import { Bell, Globe, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import type { PersistedSettings, SettingsUpdater } from "./settings-types";

export function SettingsNotificationToggles({
  s,
  update,
}: {
  s: PersistedSettings;
  update: SettingsUpdater;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-transparent p-4 sm:p-5 space-y-3">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25] blueprint-grid mix-blend-screen"
        aria-hidden
      />
      <div className="relative space-y-3">
        <h4 className="px-1 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Visibility &amp; Notifications
        </h4>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Globe className="size-5 shrink-0 text-orange" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Public Listing</p>
                <p className="text-sm text-slate-400">Show in the directory</p>
              </div>
            </div>
            <Switch checked={s.publicListing} onCheckedChange={(v) => update("publicListing", v)} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Bell className="size-5 shrink-0 text-orange" />
              <p className="font-semibold text-white">New Job Alerts</p>
            </div>
            <Switch checked={s.jobAlerts} onCheckedChange={(v) => update("jobAlerts", v)} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Mail className="size-5 shrink-0 text-orange" />
              <p className="font-semibold text-white">Weekly Digest</p>
            </div>
            <Switch checked={s.weeklyDigest} onCheckedChange={(v) => update("weeklyDigest", v)} />
          </div>
        </div>
      </div>
    </section>
  );
}
