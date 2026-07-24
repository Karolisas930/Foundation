/**
 * Barrel: shared building blocks for the HomeownerForm sub-components.
 * The individual pieces live in ./parts/* — this file only re-exports them
 * so existing imports (`@/features/homeowner/jobs/post-project/parts`) keep
 * working after the split.
 */
export { Card, Field, SummaryRow } from "./parts/Card";
export { TradeCombobox } from "./parts/TradeCombobox";
export { TradeAccordion } from "./parts/TradeAccordion";
export { TradeDetailsFields, type TradeDetails } from "./parts/TradeDetailsFields";
export { TRADE_OPTIONS } from "@/regions";
export {
  PROJECT_LANGUAGES,
  formatProjectLanguage,
  formatProjectLanguages,
  type ProjectLanguageCode,
} from "./project-language";
