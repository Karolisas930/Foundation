/**
 * AISpecCard — photos/documents upload only.
 * Voice memo now lives in the top-level QuickVoiceCard.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Image as ImageIcon, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { Card } from "./parts";
import { cn } from "@/lib/utils";

export type AISpecState = {
  audioUrl: string | null;
  mediaFiles: File[];
};

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AISpecCard({
  mediaFiles,
  setMediaFiles,
}: {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function ingest(files: FileList | File[] | null) {
    if (!files || (files as FileList).length === 0) return;
    setMediaFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const additions = Array.from(files as FileList).filter((f) => {
        const key = `${f.name}:${f.size}`;
        if (seen.has(key)) return false;
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} is larger than 10 MB and was skipped.`);
          return false;
        }
        seen.add(key);
        return true;
      });
      const merged = [...prev, ...additions];
      if (merged.length > 5) {
        toast.warning("Maximum 5 files — only the first 5 will be kept.");
      }
      return merged.slice(0, 5);
    });
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  }

  function removeMedia(idx: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const atLimit = mediaFiles.length >= 5;

  return (
    <Card
      tone={3}
      id="card_ai_specification"
      icon={<Sparkles className="size-4" />}
      title="Upload photos or documents"
      subtitle="Photos, blueprints or PDFs help trades understand your project faster. Optional — voice memo above works too."
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => !atLimit && mediaInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!atLimit) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!atLimit) ingest(e.dataTransfer.files);
          }}
          disabled={atLimit}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all",
            "border-white/15 bg-white/[0.03] hover:border-orange/50 hover:bg-orange/[0.06]",
            dragOver && "border-orange/70 bg-orange/10 scale-[1.01]",
            atLimit && "cursor-not-allowed opacity-60 hover:border-white/15 hover:bg-white/[0.03]",
          )}
          aria-label="Add photos or documents"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-orange/15 text-orange-glow ring-1 ring-orange/30 transition-transform group-hover:scale-105">
            <UploadCloud className="size-5" />
          </span>
          <span className="text-sm font-semibold text-white">
            {atLimit
              ? "File limit reached (5)"
              : dragOver
                ? "Drop to upload"
                : "Drag files here or click to browse"}
          </span>
          <span className="text-[11px] text-slate-400">
            JPG, PNG or PDF · up to 10 MB each · max 5 files
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-glow/90">
            {mediaFiles.length}/5 uploaded
          </span>
        </button>

        <input
          ref={mediaInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => ingest(e.target.files)}
        />

        {mediaFiles.length > 0 && (
          <ul className="space-y-1.5 text-xs text-slate-200">
            {mediaFiles.map((f, i) => {
              const isPdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[color:var(--navy-deep)]/55 px-3 py-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-orange-glow">
                    {isPdf ? <FileText className="size-4" /> : <ImageIcon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{f.name}</p>
                    <p className="text-[11px] text-slate-400">{humanSize(f.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
