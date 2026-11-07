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

export function accountTypeLabel(accountType: string | null | undefined) {
  if (!accountType) return "Unknown";
  return LABELS[accountType] ?? accountType;
}

/** Clean name for the sign-in users list: "Legal Name (Company)". Role lives in profiles/admin directory. */
export function authDisplayName(_accountType: string, legalName: string, company?: string | null) {
  const name = legalName.trim();
  const co = (company ?? "").trim();
  return co && co !== name ? `${name} (${co})` : name;
}
