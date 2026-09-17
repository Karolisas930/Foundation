/**
 * Germany region: re-exports all DE-specific data & clients.
 * Consumers should import from `@/regions` (barrel), not this file directly.
 *
 * Note: both `postcode-de` (local lookup) and `openplz` (remote API) expose
 * a `PostcodeHit` type. The local one is the canonical `PostcodeHit`;
 * the remote one is re-exported as `OpenPlzPostcodeHit`.
 */
export * from "./country-data";
export * from "./postcode-de";
export * from "./streets-de";
export { type TradeKey } from "./trade-categories";
export { TRADE_CATEGORIES as TRADE_CATEGORIES_BY_KEY } from "./trade-categories";

// Re-export openplz without its `PostcodeHit` (renamed to avoid collision).
export {
  lookupPostalCodeOpenPLZ,
  fetchStreetsOpenPLZ,
  type PostcodeHit as OpenPlzPostcodeHit,
} from "./openplz";
