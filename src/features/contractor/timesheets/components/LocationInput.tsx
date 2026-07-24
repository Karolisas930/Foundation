/**
 * LocationInput — captures a geolocation fix for a timesheet entry.
 *
 * Uses the `useLocation` hook to read the browser's Geolocation API and
 * exposes a read-only coordinate summary plus manual refresh action.
 */
import { MapPin, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, type LocationFix } from "../hooks/useLocation";

export interface LocationInputProps {
  value?: LocationFix | null;
  onChange?: (fix: LocationFix | null) => void;
  label?: string;
}

export function LocationInput({ value, onChange, label = "Site location" }: LocationInputProps) {
  const { fix, error, loading } = useLocation(true);
  const current = value ?? fix;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <MapPin className="size-4 text-orange" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={
            current
              ? `${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)} (±${Math.round(current.accuracy)}m)`
              : loading
                ? "Locating…"
                : (error ?? "Not captured")
          }
          className="font-mono text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange?.(fix)}
          disabled={!fix}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
