/**
 * usePostcodeLookup — resolves a 5-digit German postcode into city + state.
 * First hits the local bundled list, then falls back to OpenPLZ. Clears the
 * auto-filled values whenever the postcode is edited away from a match.
 */
import { useEffect } from "react";
import { lookupGermanPostcode } from "@/regions";
import { lookupPostalCodeOpenPLZ } from "@/regions";

interface Params {
  postalCode: string;
  cityAutoFilled: boolean;
  setCity: (v: string) => void;
  setStateName: (v: string) => void;
  setCityAutoFilled: (v: boolean) => void;
  setStateAutoFilled: (v: boolean) => void;
}

export function usePostcodeLookup({
  postalCode,
  cityAutoFilled,
  setCity,
  setStateName,
  setCityAutoFilled,
  setStateAutoFilled,
}: Params) {
  useEffect(() => {
    const hit = lookupGermanPostcode(postalCode);
    if (hit) {
      setCity(hit.city);
      setStateName(hit.state);
      setCityAutoFilled(true);
      setStateAutoFilled(true);
    } else if (cityAutoFilled) {
      setCity("");
      setStateName("");
      setCityAutoFilled(false);
      setStateAutoFilled(false);
    }

    if (!/^\d{5}$/.test(postalCode)) return;
    const controller = new AbortController();
    lookupPostalCodeOpenPLZ(postalCode, { signal: controller.signal })
      .then((openHit) => {
        if (!openHit || controller.signal.aborted) return;
        setCity(openHit.city);
        setStateName(openHit.state);
        setCityAutoFilled(true);
        setStateAutoFilled(true);
      })
      .catch(() => {
        /* fail soft — user can still type manually */
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);
}
