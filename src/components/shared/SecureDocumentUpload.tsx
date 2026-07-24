/**
 * SecureDocumentUpload — isolated staff capture module.
 *
 * Mobile-optimized: opens the rear camera viewfinder directly via
 * `capture="environment"` for photos, plus a separate PDF picker.
 *
 * Storage layout: bucket `staff-documents`, path `<ownerId>/<memberId>/<uuid>.<ext>`.
 * Metadata is logged to `public.staff_document_logs` (owner_id + text member_id),
 * kept fully separate from the manager finanz views.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, FileText, Loader2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";

// Cast to bypass generated Database types (the staff_document_logs table
// lives in a migration that isn't reflected in the generated types yet).
const supabase = supabaseTyped as any;

const BUCKET = "staff-documents";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export interface StaffDocumentLog {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  kind: "photo" | "pdf";
  captured_via: "camera" | "upload";
  storage_path: string;
  uploaded_at: string;
}

interface SecureDocumentUploadProps {
  ownerId: string;
  memberId: string;
  memberName?: string;
  onUploaded?: (log: StaffDocumentLog) => void;
}

function extFromName(name: string, fallback: string) {
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return fallback;
  return name.slice(dot + 1).toLowerCase();
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SecureDocumentUpload({
  ownerId,
  memberId,
  memberName,
  onUploaded,
}: SecureDocumentUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<StaffDocumentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data, error: qErr } = await supabase
      .from("staff_document_logs")
      .select("id, file_name, mime_type, size_bytes, kind, captured_via, storage_path, uploaded_at")
      .eq("owner_id", ownerId)
      .eq("member_id", memberId)
      .order("uploaded_at", { ascending: false })
      .limit(50);
    if (qErr) {
      setError(qErr.message);
    } else {
      setLogs((data ?? []) as StaffDocumentLog[]);
      setError(null);
    }
    setLoading(false);
  }, [ownerId, memberId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleFile = useCallback(
    async (file: File | null, source: "camera" | "upload") => {
      if (!file) return;
      if (file.size > MAX_BYTES) {
        toast.error(`File too large (max ${formatSize(MAX_BYTES)})`);
        return;
      }
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      if (!isPdf && !isImage) {
        toast.error("Only images or PDF documents are allowed");
        return;
      }

      setUploading(true);
      try {
        const kind: "photo" | "pdf" = isPdf ? "pdf" : "photo";
        const ext = extFromName(file.name, isPdf ? "pdf" : "jpg");
        const id = uuid();
        const path = `${ownerId}/${memberId}/${id}.${ext}`;

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          upsert: false,
        });
        if (upErr) throw upErr;

        const { data: logRow, error: logErr } = await supabase
          .from("staff_document_logs")
          .insert({
            owner_id: ownerId,
            member_id: memberId,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
            size_bytes: file.size,
            kind,
            captured_via: source,
          })
          .select(
            "id, file_name, mime_type, size_bytes, kind, captured_via, storage_path, uploaded_at",
          )
          .single();
        if (logErr) throw logErr;

        const record = logRow as StaffDocumentLog;
        setLogs((prev) => [record, ...prev]);
        onUploaded?.(record);
        toast.success(source === "camera" ? "Photo captured" : "Document uploaded");
      } catch (e: any) {
        console.error("[SecureDocumentUpload] upload failed", e);
        toast.error(e?.message ?? "Upload failed");
      } finally {
        setUploading(false);
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        if (pdfInputRef.current) pdfInputRef.current.value = "";
      }
    },
    [ownerId, memberId, onUploaded],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Secure documents</h3>
          <p className="text-xs text-slate-400">
            {memberName ? `Uploads for ${memberName}` : "Camera & PDF capture"} — stored per
            employee.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-20 flex-col gap-1"
          disabled={uploading}
          onClick={() => cameraInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className="text-xs font-medium">Take photo</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-20 flex-col gap-1"
          disabled={uploading}
          onClick={() => pdfInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs font-medium">Upload PDF</span>
        </Button>
      </div>

      {/* Native camera viewfinder — rear camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null, "camera")}
      />
      {/* Standard PDF picker fallback */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null, "upload")}
      />

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Recent uploads
        </h4>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-400">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/5 px-2.5 py-2 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {log.kind === "pdf" ? (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                  <span className="truncate">{log.file_name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-slate-400">
                  <span>{formatSize(log.size_bytes)}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
