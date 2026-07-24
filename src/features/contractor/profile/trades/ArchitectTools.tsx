/**
 * ArchitectTools — trade-specific tool cards for the Architect sector.
 *
 * Blueprint target for architect profile tooling. Delegates to the
 * existing `ArchitectCards` surface so we can migrate call sites without
 * duplicating card definitions.
 */
import { ArchitectCards } from "./ArchitectCards";

export function ArchitectTools() {
  return <ArchitectCards />;
}
