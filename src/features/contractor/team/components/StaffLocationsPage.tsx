/**
 * StaffLocationsPage — Business-owner view of team member locations.
 *
 * Location sharing is strictly opt-in per member. Owners can request an
 * update; the actual GPS fix is captured on the member's own device via
 * navigator.geolocation. Consent state and last known fixes are stored
 * locally (mirrors the demo-mode pattern used elsewhere in the app).
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, ShieldCheck, ShieldOff, RefreshCw, ExternalLink, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { loadTeam, subscribeTeam, type TeamMember } from "@/features/contractor/team/team-store";
import {
  captureCurrentLocation,
  formatRelative,
  setConsent,
  useConsentMap,
  useLocationFixes,
} from "@/features/contractor/team/staff-locations-store";

export function StaffLocationsPage() {
  const [team, setTeam] = useState<TeamMember[]>(() => loadTeam());
  useEffect(() => subscribeTeam(() => setTeam(loadTeam())), []);
  const consent = useConsentMap();
  const fixes = useLocationFixes();

  const staff = useMemo(
    () => team.filter((m) => m.role !== "Owner" && m.status === "active"),
    [team],
  );
  const optedIn = staff.filter((m) => consent[m.id]?.granted).length;
  const withFix = staff.filter((m) => fixes[m.id]).length;

  function toggle(memberId: string, next: boolean) {
    setConsent(memberId, next);
    toast.success(next ? "Location sharing enabled" : "Location sharing revoked", {
      description: next
        ? "You can revoke this at any time."
        : "Any stored coordinates have been cleared.",
    });
  }

  async function capture(m: TeamMember) {
    if (!consent[m.id]?.granted) {
      toast.error("Enable sharing first", {
        description: `${m.name} must opt in before location can be captured.`,
      });
      return;
    }
    try {
      const fix = await captureCurrentLocation(m.id);
      toast.success(`Location updated for ${m.name}`, {
        description: `±${Math.round(fix.accuracy)}m accuracy`,
      });
    } catch (e) {
      toast.error("Could not get location", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Staff Locations</h1>
            <p className="text-sm text-muted-foreground">
              See where consenting team members are, on the way to a job.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-primary" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Consent-first location sharing</p>
              <p className="text-xs text-muted-foreground">
                Nothing is tracked without an explicit opt-in per member. Sharing can be revoked at
                any time — stored coordinates are cleared immediately. Under GDPR you should only
                enable this for genuine operational purposes (dispatch, safety) and disclose it in
                your privacy notice.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Team members" value={staff.length} />
            <Stat label="Opted in" value={optedIn} />
            <Stat label="With recent fix" value={withFix} />
          </div>
        </div>

        {staff.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2">
            {staff.map((m) => {
              const granted = !!consent[m.id]?.granted;
              const fix = fixes[m.id];
              return (
                <li key={m.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {m.name
                        .split(/\s+/)
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{m.name}</p>
                        <ConsentBadge granted={granted} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>

                      {granted ? (
                        fix ? (
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="font-mono text-foreground/85">
                              {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
                              <span className="ml-2 text-muted-foreground">
                                ±{Math.round(fix.accuracy)}m
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              Updated {formatRelative(fix.capturedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">No fix captured yet.</p>
                        )
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Location sharing is off for this member.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={granted}
                        onCheckedChange={(v) => toggle(m.id, v)}
                        aria-label={`Toggle location sharing for ${m.name}`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {fix ? (
                      <Button asChild size="sm" variant="ghost">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${fix.lat}&mlon=${fix.lng}#map=17/${fix.lat}/${fix.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          View on map
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => capture(m)}
                      disabled={!granted}
                      variant={granted ? "default" : "secondary"}
                    >
                      <RefreshCw className="mr-1 h-4 w-4" />
                      {fix ? "Refresh" : "Capture now"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ConsentBadge({ granted }: { granted: boolean }) {
  return granted ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
      <ShieldCheck className="h-3 w-3" /> Consented
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <ShieldOff className="h-3 w-3" /> Off
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
      <Users className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 font-medium">No active staff yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite team members from Team & Staff, then enable location sharing here.
      </p>
    </div>
  );
}
