/**
 * TestingSwitchboard — floating dev panel for switching between roles
 * and sectors without a real auth flow.
 *
 * Stores the current role + sector in sessionStorage. The dashboard
 * route reads these to mount the right panel through <Chameleon />.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FlaskConical, Lock, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SECTORS,
  SECTOR_ORDER,
  canRoleAccessSector,
  defaultSectorForRole,
  type SectorId,
  type SectorRole,
} from "@/core/sector-config";

const ROLE_GROUPS: { label: string; roles: SectorRole[] }[] = [
  { label: "Privileged", roles: ["admin", "b2b_master", "build"] },
  { label: "Business", roles: ["business", "architect"] },
  { label: "Operators", roles: ["handyman", "security", "logistics", "disposal"] },
  { label: "Client", roles: ["homeowner"] },
];

const ROLE_KEY = "handwerk-preview-role";
const SECTOR_KEY = "handwerk-preview-sector";

export function readPreviewRole(): SectorRole {
  if (typeof window === "undefined") return "admin";
  const r = window.sessionStorage.getItem(ROLE_KEY) as SectorRole | null;
  return r ?? "admin";
}

export function readPreviewSector(): SectorId | null {
  if (typeof window === "undefined") return null;
  const s = window.sessionStorage.getItem(SECTOR_KEY) as SectorId | null;
  return s && s in SECTORS ? s : null;
}

export function TestingSwitchboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<SectorRole>("admin");
  const [sector, setSector] = useState<SectorId>("build");

  // Hydrate from sessionStorage on mount.
  useEffect(() => {
    const r = readPreviewRole();
    const s = readPreviewSector() ?? defaultSectorForRole(r);
    setRole(r);
    setSector(s);
  }, []);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const availableSectors = useMemo(
    () => SECTOR_ORDER.filter((id) => canRoleAccessSector(role, id)),
    [role],
  );
  const lockedSectors = useMemo(
    () => SECTOR_ORDER.filter((id) => !canRoleAccessSector(role, id)),
    [role],
  );
  const roleDefault = defaultSectorForRole(role);

  function applyRole(next: SectorRole) {
    setRole(next);
    const nextSector = canRoleAccessSector(next, sector) ? sector : defaultSectorForRole(next);
    setSector(nextSector);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ROLE_KEY, next);
      window.sessionStorage.setItem(SECTOR_KEY, nextSector);
    }
    void navigate({
      to: nextSector === "homeowner" ? "/homeowner" : "/contractor",
      replace: true,
    });
  }

  function applySector(next: SectorId) {
    if (!canRoleAccessSector(role, next)) return;
    setSector(next);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SECTOR_KEY, next);
    }
    void navigate({
      to: next === "homeowner" ? "/homeowner" : "/contractor",
      replace: true,
    });
  }

  function resetToRoleDefault() {
    applySector(roleDefault);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur transition hover:border-orange/60 hover:text-orange"
        aria-label="Open role and sector switcher"
      >
        <FlaskConical className="size-3.5 text-orange" />
        <span>Dev</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-80 max-h-[85vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          <FlaskConical className="size-3.5 text-orange" />
          Testing Switchboard
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="border-orange/30 px-1.5 text-[10px] font-medium text-orange"
          >
            DEV
          </Badge>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Hide switchboard"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <section>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Role
            </div>
            <Badge variant="outline" className="px-1.5 text-[10px] font-normal">
              default → {SECTORS[roleDefault].shortLabel}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {ROLE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.roles.map((r) => {
                    const active = r === role;
                    return (
                      <Button
                        key={r}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-[11px] capitalize"
                        onClick={() => applyRole(r)}
                      >
                        {r.replace("_", " ")}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sector ({availableSectors.length}/{SECTOR_ORDER.length})
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-[10px] text-slate-500 hover:text-orange"
              onClick={resetToRoleDefault}
            >
              <RotateCcw className="size-3" /> default
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {availableSectors.map((id) => {
              const def = SECTORS[id];
              const Icon = def.icon;
              const active = id === sector;
              return (
                <Button
                  key={id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-auto justify-start gap-1.5 px-2 py-1 text-[11px]"
                  onClick={() => applySector(id)}
                >
                  <Icon className="size-3 shrink-0" />
                  <span className="truncate">{def.shortLabel}</span>
                </Button>
              );
            })}
          </div>

          {lockedSectors.length > 0 && (
            <div className="mt-1.5">
              <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Locked by RBAC
              </div>
              <div className="flex flex-wrap gap-1">
                {lockedSectors.map((id) => {
                  const def = SECTORS[id];
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded border border-dashed border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400"
                      title={`Requires: ${def.allowedRoles.join(", ")}`}
                    >
                      <Lock className="size-2.5" />
                      {def.shortLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <p className="text-[10px] leading-relaxed text-slate-500">
          RBAC preview: each role exposes only the sectors it can access. Selections persist in
          sessionStorage.
        </p>
      </div>
    </div>
  );
}

export default TestingSwitchboard;
