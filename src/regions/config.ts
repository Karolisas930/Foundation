/**
 * Active-region selector. The app is Germany-only for now; expose a single
 * constant so future regions can be swapped in without touching call sites.
 */
export type RegionCode = "de";

export const ACTIVE_REGION: RegionCode = "de";

export const isGermany = () => ACTIVE_REGION === "de";
