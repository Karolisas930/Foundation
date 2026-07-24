/**
 * ============================================================================
 *  PROTECTED CORE FILE — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
 * ----------------------------------------------------------------------------
 *  This file is part of the Chameleon / Dynamic Sector core and the project's
 *  shared theming surface. Edits here cascade across every sector, route, and
 *  visual primitive. Refactors, renames, "cleanups", or stylistic rewrites
 *  are NOT permitted unless the user has specifically requested a change to
 *  this file by name.
 *
 *  Allowed: additive, backwards-compatible fixes the user explicitly asked for.
 *  Forbidden: silent reorganization, removing exports, changing public API,
 *  swapping tokens, or "modernizing" patterns.
 * ============================================================================
 */
/**
 * Chameleon — dynamic sector renderer.
 *
 * Resolves a sector id against the SECTORS registry and lazy-mounts the
 * matching panel inside a Suspense boundary. The host (dashboard route)
 * decides which sector id to render; this component only handles the
 * load + fallback contract.
 */
import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { SECTORS, type SectorId } from "@/core/sector-config";

interface ChameleonProps {
  sector: SectorId;
}

export function Chameleon({ sector }: ChameleonProps) {
  // Resolve to the requested sector when defined in the registry, otherwise
  // fall back to the homeowner portal so the dashboard always renders.
  const resolved: SectorId = SECTORS[sector] ? sector : "homeowner";
  const Panel = useMemo(() => lazy(SECTORS[resolved].load), [resolved]);

  return (
    <Suspense fallback={<ChameleonFallback sector={resolved} />}>
      <Panel sector={resolved} />
    </Suspense>
  );
}

function ChameleonFallback({ sector }: { sector: SectorId }) {
  const def = SECTORS[sector];
  return (
    <div className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="size-6 animate-spin text-orange" />
        <div className="text-sm font-medium">Loading {def.shortLabel}…</div>
      </div>
    </div>
  );
}

export default Chameleon;
