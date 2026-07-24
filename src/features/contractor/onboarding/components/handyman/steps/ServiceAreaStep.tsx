/**
 * ServiceAreaStep — Step 3. Postcode + auto-detected city/state, street
 * with autocomplete, house number, and travel radius slider.
 */
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  CARD_CLS,
  HEADER_CLS,
} from "@/features/contractor/onboarding/components/onboarding-constants";
import { StreetAutocomplete } from "@/features/contractor/onboarding/components/StreetAutocomplete";

interface Props {
  postalCode: string;
  city: string;
  stateName: string;
  streetAddress: string;
  houseNumber: string;
  radius: number[];
  cityAutoFilled: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onTouch: (k: string) => void;
  setPostalCode: (v: string) => void;
  setCity: (v: string) => void;
  setStateName: (v: string) => void;
  setCityAutoFilled: (v: boolean) => void;
  setStateAutoFilled: (v: boolean) => void;
  setStreetAddress: (v: string) => void;
  setHouseNumber: (v: string) => void;
  setRadius: (v: number[]) => void;
}

export function ServiceAreaStep(props: Props) {
  const {
    postalCode,
    city,
    stateName,
    streetAddress,
    houseNumber,
    radius,
    cityAutoFilled,
    errors,
    touched,
    onTouch,
    setPostalCode,
    setCity,
    setStateName,
    setCityAutoFilled,
    setStateAutoFilled,
    setStreetAddress,
    setHouseNumber,
    setRadius,
  } = props;

  return (
    <section id="area" className={CARD_CLS}>
      <h2 className={HEADER_CLS}>Service area</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="postalCode" className="text-white">
            Postal code
          </Label>
          <Input
            id="postalCode"
            inputMode="numeric"
            maxLength={5}
            placeholder="68159"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            onBlur={() => onTouch("postalCode")}
            className={cn(
              "intake-input mt-2",
              touched.postalCode && errors.postalCode && "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.postalCode && errors.postalCode && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.postalCode}</p>
          )}
        </div>
        <div>
          <Label htmlFor="city" className="text-white">
            City
          </Label>
          <Input
            id="city"
            maxLength={120}
            placeholder="Mannheim"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCityAutoFilled(false);
            }}
            className="intake-input mt-2"
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-white">
            State
          </Label>
          <Input
            id="state"
            readOnly
            tabIndex={-1}
            placeholder="Auto-detected"
            value={stateName}
            aria-label="State (auto-detected from postcode)"
            className="intake-input mt-2 cursor-default text-slate-300"
          />
        </div>
      </div>

      {cityAutoFilled && (city || stateName) && (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-[11px] font-medium text-emerald-200">
          <Sparkles className="size-3 text-emerald-300" />
          We auto-filled <span className="text-white">{city}</span>
          {stateName ? (
            <>
              {" "}
              · <span className="text-white">{stateName}</span>
            </>
          ) : null}{" "}
          from your postcode. Edit if needed.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div>
          <Label htmlFor="streetAddress" className="text-white">
            Street name <span className="text-orange">*</span>
          </Label>
          <div className="mt-2">
            <StreetAutocomplete
              id="streetAddress"
              required
              maxLength={200}
              placeholder={
                /^\d{5}$/.test(postalCode) ? "e.g. Hauptstraße" : "Enter postcode first…"
              }
              value={streetAddress}
              postalCode={postalCode}
              onChange={(v) => setStreetAddress(v)}
              onSelectAddress={(addr) => {
                if (addr.city) {
                  setCity(addr.city);
                  setCityAutoFilled(true);
                }
                if (addr.state) {
                  setStateName(addr.state);
                  setStateAutoFilled(true);
                }
                if (addr.postcode && addr.postcode !== postalCode) {
                  setPostalCode(addr.postcode);
                }
              }}
              onBlur={() => onTouch("streetAddress")}
              invalid={Boolean(touched.streetAddress && errors.streetAddress)}
            />
          </div>
          {touched.streetAddress && errors.streetAddress && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.streetAddress}</p>
          )}
        </div>
        <div>
          <Label htmlFor="houseNumber" className="text-white">
            House no. <span className="text-orange">*</span>
          </Label>
          <Input
            id="houseNumber"
            inputMode="text"
            autoComplete="address-line2"
            maxLength={12}
            placeholder="42a"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            onBlur={() => onTouch("houseNumber")}
            className={cn(
              "intake-input mt-2",
              touched.houseNumber && errors.houseNumber && "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.houseNumber && errors.houseNumber && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.houseNumber}</p>
          )}
        </div>
      </div>
      <p className="text-[11px] leading-5 text-slate-400">
        Start typing your street — we'll suggest matches for your postcode.
      </p>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="radius" className="text-white">
            Service radius
          </Label>
          <span className="text-xs font-medium text-slate-400">{radius[0]} km</span>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            id="radius"
            min={1}
            max={300}
            step={1}
            value={radius}
            onValueChange={setRadius}
            onValueCommit={setRadius}
            className="flex-1 h-8 py-3 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              value={radius[0]}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const parsed = parseInt(raw, 10);
                if (Number.isNaN(parsed)) return;
                const clamped = Math.min(300, Math.max(1, parsed));
                setRadius([clamped]);
              }}
              onBlur={(e) => {
                if (e.target.value === "") setRadius([1]);
              }}
              className="h-12 w-20 text-center text-base font-semibold"
              aria-label="Service radius in kilometres"
            />
            <span className="text-sm font-medium text-slate-400">km</span>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Measured from your business address.</p>
      </div>
    </section>
  );
}
