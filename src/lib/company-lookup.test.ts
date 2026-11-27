import { describe, expect, it } from "vitest";
import { parseCompanies } from "./company-lookup";

describe("company registration details", () => {
  it("returns the selected company's name, address and available contact details", () => {
    const companies = parseCompanies([{ osm_type: "node", osm_id: 123, category: "office", name: "Müller Bau GmbH", address: { road: "Hauptstraße", house_number: "42", postcode: "68159", city: "Mannheim", state: "Baden-Württemberg", country_code: "de" }, extratags: { "contact:email": "office@mueller.example", "contact:phone": "+49 621 123456" } }]);
    expect(companies[0]).toMatchObject({ name: "Müller Bau GmbH", street: "Hauptstraße", houseNumber: "42", postalCode: "68159", city: "Mannheim", email: "office@mueller.example", phone: "+49 621 123456" });
  });
  it("leaves unavailable details empty instead of inventing them", () => {
    expect(parseCompanies([{ category: "office", name: "Example" }])[0]).toMatchObject({ email: "", phone: "", street: "", postalCode: "" });
  });
  it("does not treat a matching street as a company", () => {
    expect(parseCompanies([{ category: "highway", name: "Company Road" }])).toEqual([]);
  });
});