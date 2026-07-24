/**
 * AddressContactCard — homeowner identity + OpenPLZ address lookup.
 *
 * - Postal code: async OpenPLZ locality lookup (falls back to a local
 *   Baden-Württemberg dataset) auto-fills City + State.
 * - Street:      StreetAutocomplete (OpenPLZ Streets → Nominatim fallback)
 *   surfaces a debounced typeahead scoped to the entered PLZ. Street name
 *   and house number are separate inputs for cleaner data entry.
 */
import { useEffect, useState } from "react";
import { MapPin, User, Home, Hash, Sparkles, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, Field } from "./parts";
import { lookupGermanPostcode } from "@/regions";
import { lookupPostalCodeOpenPLZ } from "@/regions";
import { StreetAutocomplete } from "@/features/contractor/onboarding/components/StreetAutocomplete";

export function AddressContactCard({
  postalCode,
  setPostalCode,
  city,
  setCity,
  cityAutoFilled,
  setCityAutoFilled,
}: {
  postalCode: string;
  setPostalCode: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  cityAutoFilled: boolean;
  setCityAutoFilled: (v: boolean) => void;
}) {
  const [stateRegion, setStateRegion] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  // Instantly resolve City + State when a valid 5-digit PLZ is entered.
  useEffect(() => {
    const local = lookupGermanPostcode(postalCode);
    if (local) {
      setCity(local.city);
      setStateRegion(local.state);
      setCityAutoFilled(true);
    } else if (cityAutoFilled) {
      setCity("");
      setStateRegion("");
      setCityAutoFilled(false);
    }

    if (!/^\d{5}$/.test(postalCode)) return;
    const controller = new AbortController();
    lookupPostalCodeOpenPLZ(postalCode, { signal: controller.signal })
      .then((hit) => {
        if (!hit || controller.signal.aborted) return;
        setCity(hit.city);
        setStateRegion(hit.state);
        setCityAutoFilled(true);
      })
      .catch(() => {
        /* fail soft — manual entry still works */
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  const plzValid = /^\d{5}$/.test(postalCode);
  const combinedStreet = [street.trim(), houseNumber.trim()].filter(Boolean).join(" ");

  return (
    <Card
      tone={2}
      id="card_address_contact"
      icon={<MapPin className="size-4" />}
      title="Address & contact"
    >
      <div className="space-y-5">
        <Field id="fullName" label="Full name" required icon={<User className="size-3.5" />}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            maxLength={120}
            className="intake-input"
          />
        </Field>
        <Field id="email" label="Email address" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="intake-input"
          />
        </Field>
        <Field id="mobile" label="Mobile number" required>
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={32}
            placeholder="+49 17X XXX XXXX"
            className="intake-input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="postalCode" label="Postal code" required>
            <Input
              id="postalCode"
              name="postalCode"
              inputMode="numeric"
              maxLength={5}
              placeholder="68159"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
              className="intake-input"
            />
          </Field>
          <Field id="city" label="City">
            <Input
              id="city"
              name="city"
              maxLength={120}
              placeholder="Mannheim"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCityAutoFilled(false);
              }}
              className="intake-input"
            />
          </Field>
          <Field id="state" label="State">
            <Input
              id="state"
              name="state"
              readOnly
              tabIndex={-1}
              placeholder="Auto-detected"
              value={stateRegion}
              aria-label="State (auto-detected from postcode)"
              className="intake-input cursor-default text-slate-300"
            />
          </Field>
        </div>

        {cityAutoFilled && (city || stateRegion) && (
          <p className="-mt-2 flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-[11px] font-medium text-emerald-200">
            <Sparkles className="size-3 text-emerald-300" />
            We auto-filled <span className="text-white">{city}</span>
            {stateRegion ? (
              <>
                {" "}
                · <span className="text-white">{stateRegion}</span>
              </>
            ) : null}{" "}
            from your postcode. Edit if needed.
          </p>
        )}

        {/* Split street + house number for cleaner data entry. */}
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field id="street" label="Street name" required icon={<Home className="size-3.5" />}>
            <StreetAutocomplete
              id="street"
              required
              maxLength={200}
              placeholder={plzValid ? "e.g. Hauptstraße" : "Enter postcode first…"}
              value={street}
              postalCode={postalCode}
              onChange={(v) => setStreet(v)}
              onSelectAddress={(addr) => {
                if (addr.city) {
                  setCity(addr.city);
                  setCityAutoFilled(true);
                }
                if (addr.state) setStateRegion(addr.state);
              }}
            />
          </Field>
          <Field id="houseNumber" label="House no." required icon={<Hash className="size-3.5" />}>
            <Input
              id="houseNumber"
              inputMode="text"
              autoComplete="address-line2"
              maxLength={12}
              placeholder="42a"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="intake-input"
            />
          </Field>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-400">
          <Info className="mt-0.5 size-3 shrink-0 text-slate-500" />
          Start typing your street — we'll suggest matches for your postcode. Your exact address
          stays private until you accept a quote.
        </p>

        {/* Hidden inputs mirror combined + individual values into the form payload. */}
        <input type="hidden" name="street" value={combinedStreet} />
        <input type="hidden" name="streetName" value={street} />
        <input type="hidden" name="houseNumber" value={houseNumber} />
      </div>
    </Card>
  );
}
