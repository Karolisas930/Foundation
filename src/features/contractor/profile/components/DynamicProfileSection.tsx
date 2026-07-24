/**
 * DynamicProfileSection — renders the Chameleon sector panel for the
 * current contractor sector within the profile page.
 *
 * Thin wrapper around the protected `Chameleon` renderer so the profile
 * slice does not import from `@/core` directly.
 */
import { Chameleon } from "@/core/DynamicSectorRenderer";
import type { SectorId } from "@/core/sector-config";

export interface DynamicProfileSectionProps {
  sector: SectorId;
}

export function DynamicProfileSection({ sector }: DynamicProfileSectionProps) {
  return <Chameleon sector={sector} />;
}
