/**
 * SiteSecurityTools — trade-specific tool cards for the Security sector.
 *
 * Blueprint target for on-site security tooling. Delegates to the
 * existing `SecurityCards` surface.
 */
import { SecurityCards } from "./SecurityCards";

export function SiteSecurityTools() {
  return <SecurityCards />;
}
