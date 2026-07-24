/**
 * TradeComplianceChecklist — Automated Tradesperson Verification module.
 *
 * Renders a checklist of required German trade documents. Status is derived
 * from the `staff_document_logs` metadata table (matched by document `kind`
 * slug). Each row exposes the SecureDocumentUpload camera capture so workers
 * can snap missing paperwork on the spot.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, Clock, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SecureDocumentUpload } from "@/components/shared/SecureDocumentUpload";

const supabase = supabaseTyped as any;

type ChecklistStatus = "pending" | "uploaded" | "missing";

interface ChecklistItem {
  slug: string;
  label: string;
  hint: string;
  defaultStatus: ChecklistStatus;
}

const CHECKLIST: ChecklistItem[] = [
  {
    slug: "meisterbrief",
    label: "Master Certificate / Trade License",
    hint: "Master tradesperson certificate registered with the trade chamber.",
    defaultStatus: "pending",
  },
  {
    slug: "gewerbeanmeldung",
    label: "Business Registration",
    hint: "Official trade registration from the local trade office.",
    defaultStatus: "uploaded",
  },
  {
    slug: "betriebshaftpflicht",
    label: "Business Liability Insurance",
    hint: "Business liability insurance — required for site work.",
    defaultStatus: "missing",
  },
];

interface LogRow {
  id: string;
  kind: string | null;
  storage_path: string;
  uploaded_at: string;
}

function StatusPill({ status }: { status: ChecklistStatus }) {
  if (status === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" /> Document Uploaded
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
        <Clock className="h-3.5 w-3.5" /> Verification Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300">
      <ShieldAlert className="h-3.5 w-3.5" /> Missing / Expired
    </span>
  );
}

export function TradeComplianceChecklist() {
  const { user } = useAuth();
  const ownerId = user?.id ?? "";
  const memberId = user?.id ?? "self";
  const [uploadedSlugs, setUploadedSlugs] = useState<Set<string>>(new Set());
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!ownerId) return;
    const { data } = await supabase
      .from("staff_document_logs")
      .select("id, kind, storage_path, uploaded_at")
      .eq("owner_id", ownerId)
      .order("uploaded_at", { ascending: false })
      .limit(200);
    const rows = (data ?? []) as LogRow[];
    const slugs = new Set<string>();
    for (const row of rows) {
      const path = (row.storage_path ?? "").toLowerCase();
      for (const item of CHECKLIST) {
        if (path.includes(`/${item.slug}/`) || row.kind === item.slug) {
          slugs.add(item.slug);
        }
      }
    }
    setUploadedSlugs(slugs);
  }, [ownerId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const rows = useMemo(
    () =>
      CHECKLIST.map((item) => ({
        ...item,
        status: uploadedSlugs.has(item.slug) ? ("uploaded" as ChecklistStatus) : item.defaultStatus,
      })),
    [uploadedSlugs],
  );

  return (
    <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100 shadow-lg">
      <header className="mb-4">
        <h2 className="text-base font-semibold">Trade Compliance & Document Status</h2>
        <p className="mt-1 text-xs text-slate-400">
          Automated tradesperson verification — snap a live photo of any missing paperwork.
        </p>
      </header>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.slug} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">{row.label}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{row.hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={row.status} />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5"
                  disabled={!ownerId}
                  onClick={() =>
                    setActiveSlug((current) => (current === row.slug ? null : row.slug))
                  }
                >
                  {activeSlug === row.slug ? (
                    <>
                      <X className="h-4 w-4" /> Close
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" /> Capture
                    </>
                  )}
                </Button>
              </div>
            </div>

            {activeSlug === row.slug && ownerId && (
              <div className="mt-3">
                <SecureDocumentUpload
                  ownerId={ownerId}
                  memberId={`${memberId}/${row.slug}`}
                  memberName={row.label}
                  onUploaded={() => {
                    setUploadedSlugs((prev) => new Set(prev).add(row.slug));
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {!ownerId && (
        <p className="mt-4 text-xs text-amber-300">
          Sign in to capture and log compliance documents.
        </p>
      )}
    </section>
  );
}
