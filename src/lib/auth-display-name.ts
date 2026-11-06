const LABELS: Record<string, string> = {
  handyman: "Contractor",
  contractor: "Contractor",
  homeowner: "Homeowner",
  architect: "Architect",
  business: "Business",
  security: "Security",
  logistics: "Logistics",
  disposal: "Disposal",
  build: "Builder",
};

/** Label shown in the sign-in users list: "[Contractor] Legal Name · Company". */
export function authDisplayName(accountType: string, legalName: string, company?: string | null) {
  const label = LABELS[accountType] ?? accountType;
  const name = legalName.trim();
  const co = (company ?? "").trim();
  return `[${label}] ${name}${co ? ` · ${co}` : ""}`.trim();
}
