/**
 * LegalOnboardingDashboard — local Phase 10 upload/verification screen
 * shown whenever the user's legal gate status is not
 * `APPROVED_REAL_DB_RECORD`. Fully client-side mock; approving flips the
 * status via `useLegalGate` and unblocks the main app.
 */
import { useState } from "react";
import { UploadCloud, ShieldCheck, FileText, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLegalGate } from "@/hooks/useLegalGate";
import { UserOnboardingVerificationStatus } from "@/types/legalGate";

const STATUS_META: Record<
  UserOnboardingVerificationStatus,
  { label: string; tone: "default" | "secondary" | "destructive"; icon: typeof Clock }
> = {
  [UserOnboardingVerificationStatus.PENDING_DOCUMENTATION]: {
    label: "Documents required",
    tone: "secondary",
    icon: FileText,
  },
  [UserOnboardingVerificationStatus.UNDER_REVIEW]: {
    label: "Under review",
    tone: "default",
    icon: Clock,
  },
  [UserOnboardingVerificationStatus.APPROVED_REAL_DB_RECORD]: {
    label: "Approved",
    tone: "default",
    icon: ShieldCheck,
  },
  [UserOnboardingVerificationStatus.REJECTED]: {
    label: "Rejected",
    tone: "destructive",
    icon: XCircle,
  },
  [UserOnboardingVerificationStatus.EXPIRED]: {
    label: "Expired",
    tone: "destructive",
    icon: AlertTriangle,
  },
};

export function LegalOnboardingDashboard() {
  const { status, setStatus, approve } = useLegalGate();
  const [fileName, setFileName] = useState<string | null>(null);
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Verify your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete legal registration to unlock the full workspace.
            </p>
          </div>
          <Badge variant={meta.tone} className="gap-1">
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="h-4 w-4" />
              Upload registration documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="legal-gate-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center transition hover:bg-muted/50"
            >
              <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                {fileName ?? "Drop a PDF or image, or click to browse"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Business licence, ID, or trade certificate
              </span>
              <input
                id="legal-gate-upload"
                type="file"
                className="sr-only"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFileName(f.name);
                    setStatus(UserOnboardingVerificationStatus.UNDER_REVIEW);
                  }
                }}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={approve} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Mark as approved (dev)
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatus(UserOnboardingVerificationStatus.UNDER_REVIEW)}
              >
                Simulate under review
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStatus(UserOnboardingVerificationStatus.PENDING_DOCUMENTATION)}
              >
                Reset
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Local mock — no data leaves your browser. Status persists in
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[10px]">localStorage</code>
              until the real <code>verifications</code> table is wired up.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LegalOnboardingDashboard;
