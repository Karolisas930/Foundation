/**
 * ComplianceBanner — shown on the contractor dashboard and every restricted
 * lead / chat surface when `evaluateLeadGate` denies access.
 *
 * Pure presentation — the calling component owns the gate decision and the
 * "Upload Meisterbrief" navigation.
 */
import { ShieldAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPLIANCE_BANNER_DE, type LeadGateDecision } from "@/features/contractor/leads/lead-gate";

export function ComplianceBanner({
  gate,
  onUploadClick,
  className,
}: {
  gate: LeadGateDecision;
  onUploadClick?: () => void;
  className?: string;
}) {
  if (gate.canUnlockLeads) return null;
  return (
    <div
      role="status"
      className={
        "flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-4 text-amber-100 " +
        (className ?? "")
      }
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{COMPLIANCE_BANNER_DE}</p>
        {onUploadClick ? (
          <div className="mt-3">
            <Button
              size="sm"
              onClick={onUploadClick}
              className="h-8 gap-1.5 bg-amber-500 text-xs font-bold text-slate-900 hover:bg-amber-400"
            >
              <Upload className="h-3.5 w-3.5" />
              Meisterbrief hochladen
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * BlurredValue — renders masked personal data with a CSS blur overlay.
 * Wrap around any field that must stay hidden until the gate opens.
 */
export function BlurredValue({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <span
      aria-label={label ?? "Verifizierung erforderlich"}
      className="inline-block select-none rounded bg-slate-800/60 px-1.5 py-0.5 text-slate-300 blur-[3px]"
    >
      {children}
    </span>
  );
}
