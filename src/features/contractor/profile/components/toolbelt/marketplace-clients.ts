/**
 * Marketplace clients — lightweight in-memory directory of past/known
 * marketplace clients that the Voice-to-Invoice sheet can quickly pick
 * from. Auto-fills client name + address (and inferred VAT type).
 *
 * When a real backend marketplace table exists, this can be swapped for
 * a server-fn query without changing the sheet API.
 */
export type MarketplaceClientType = "private" | "business" | "eu_business";

export type MarketplaceClient = {
  id: string;
  name: string;
  street?: string;
  postcode?: string;
  city?: string;
  type: MarketplaceClientType;
  vatId?: string;
  email?: string;
};

// Curated sample directory — represents recent marketplace bookings.
export const MARKETPLACE_CLIENTS: MarketplaceClient[] = [
  {
    id: "mc-weber",
    name: "Familie Weber",
    street: "Lindenweg 12",
    postcode: "70173",
    city: "Stuttgart",
    type: "private",
    email: "weber@example.de",
  },
  {
    id: "mc-mueller",
    name: "Thomas Müller",
    street: "Hauptstraße 4",
    postcode: "80331",
    city: "München",
    type: "private",
    email: "t.mueller@example.de",
  },
  {
    id: "mc-schmidt-gmbh",
    name: "Schmidt Bau GmbH",
    street: "Industriestraße 22",
    postcode: "10115",
    city: "Berlin",
    type: "business",
    vatId: "DE123456789",
    email: "einkauf@schmidt-bau.de",
  },
  {
    id: "mc-hausverwaltung",
    name: "Hausverwaltung Nord",
    street: "Hafenring 5",
    postcode: "20095",
    city: "Hamburg",
    type: "business",
    vatId: "DE987654321",
    email: "office@hv-nord.de",
  },
  {
    id: "mc-eu-atelier",
    name: "Atelier Dupont SARL",
    street: "12 Rue de Rivoli",
    postcode: "75001",
    city: "Paris",
    type: "eu_business",
    vatId: "FR40303265045",
    email: "contact@atelier-dupont.fr",
  },
  {
    id: "mc-becker",
    name: "Anna Becker",
    street: "Rosenweg 8",
    postcode: "50667",
    city: "Köln",
    type: "private",
    email: "a.becker@example.de",
  },
];

/** Auto-suggest a default VAT rate for a client type.
 *  private / business  → 19% (standard DE VAT)
 *  eu_business (valid VAT ID) → 0% Reverse Charge
 */
export function suggestVatRateForClient(c: MarketplaceClient): 0 | 7 | 19 {
  if (c.type === "eu_business" && c.vatId) return 0;
  return 19;
}
