/**
 * useLocation — browser geolocation for timesheet punch-in/out.
 *
 * Returns the latest coordinates (or an error) using the Geolocation API.
 * Safe on SSR: initial state is null until the effect runs on the client.
 */
import { useEffect, useState } from "react";

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UseLocationResult {
  fix: LocationFix | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(enabled = true): UseLocationResult {
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { fix, error, loading };
}
