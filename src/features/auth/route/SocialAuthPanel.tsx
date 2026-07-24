import { Button } from "@/components/ui/button";
import { GoogleIcon, AppleIcon } from "./provider-icons";
import type { BusyKey } from "./types";

export function SocialAuthPanel({
  busy,
  onProvider,
}: {
  busy: BusyKey;
  onProvider: (provider: "google" | "apple") => void;
}) {
  return (
    <div className="intake-card intake-card-tone-1 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center gap-2 border-white/15 bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08] hover:text-white"
        disabled={busy !== null}
        onClick={() => onProvider("google")}
      >
        <GoogleIcon className="size-4" />
        {busy === "google" ? "Redirecting…" : "Continue with Google"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center gap-2 border-white/15 bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08] hover:text-white"
        disabled={busy !== null}
        onClick={() => onProvider("apple")}
      >
        <AppleIcon className="size-4" />
        {busy === "apple" ? "Redirecting…" : "Continue with Apple"}
      </Button>
    </div>
  );
}
