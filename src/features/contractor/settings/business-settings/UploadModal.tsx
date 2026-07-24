import { useRef, useState } from "react";
import { FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModalShell } from "./ModalShell";
import { StatusBadge } from "./StatusBadge";
import { readJSON, writeJSON, type UploadState } from "./types";

export function UploadModal({
  open,
  onOpenChange,
  storageKey,
  title,
  subtitle,
  helper,
  accept,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  storageKey: string;
  title: string;
  subtitle: string;
  helper: string;
  accept: string;
}) {
  const existing = readJSON<UploadState>(storageKey);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !existing) {
      toast.error("Select a file to upload");
      return;
    }
    if (file) {
      writeJSON(storageKey, {
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      } satisfies UploadState);
      toast.success("Document uploaded", {
        description: "We'll review it shortly.",
      });
    }
    onOpenChange(false);
  }

  function remove() {
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
    setFile(null);
    toast.message("Document removed");
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={ShieldCheck}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {existing && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{existing.name}</p>
                <p className="text-[11px] text-white/50">
                  {(existing.size / 1024).toFixed(0)} KB · uploaded{" "}
                  {new Date(existing.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <StatusBadge status={existing.status} />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition hover:border-orange-glow/50 hover:bg-white/[0.04]"
        >
          <UploadCloud className="h-8 w-8 text-white/60" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-white">
            {file ? file.name : existing ? "Replace document" : "Tap to upload"}
          </p>
          <p className="text-[11px] text-white/50">{helper}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </button>

        <div className="flex items-center justify-between gap-2 pt-1">
          {existing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              className="text-white/60 hover:bg-white/10 hover:text-white"
            >
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {file ? "Upload" : "Done"}
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
