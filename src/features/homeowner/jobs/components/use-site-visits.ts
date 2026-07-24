/**
 * useSiteVisits — manages the homeowner site-visit selection map,
 * persisting it to localStorage under SITE_VISITS_KEY.
 */
import { useCallback, useState } from "react";
import {
  loadSiteVisits,
  SITE_VISITS_KEY,
  type SiteVisit,
} from "../../dashboard/components/parts/helpers";

export function useSiteVisits() {
  const [siteVisits, setSiteVisits] = useState<Record<string, SiteVisit>>(loadSiteVisits);

  const persistSiteVisits = useCallback((next: Record<string, SiteVisit>) => {
    setSiteVisits(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(SITE_VISITS_KEY, JSON.stringify(next));
      } catch {
        /* quota */
      }
    }
  }, []);

  return { siteVisits, persistSiteVisits };
}
