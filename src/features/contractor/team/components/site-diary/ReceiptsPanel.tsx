import { useRef, useState } from "react";
import { Lock, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addSiteDiaryEntry,
  fileToDataUrl,
  removeSiteDiaryEntry,
  type SiteDiaryEntry,
} from "@/features/contractor/team/site-diary-store";
import { formatTs } from "./utils";

export function ReceiptsPanel({
  job,
  entries,
}: {
  job: { id: string; title: string };
  entries: SiteDiaryEntry[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<{ dataUrl: string; filename: string } | null>(null);

  const items = entries.filter((e) => e.kind === "receipt");

  async function onPick(files: FileList | null) {
    if (!files || !files.length) return;
    const f = files[0];
    const dataUrl = await fileToDataUrl(f);
    setPending({ dataUrl, filename: f.name });
  }

  function save() {
    if (!pending) return;
    addSiteDiaryEntry({
      jobId: job.id,
      jobTitle: job.title,
      kind: "receipt",
      dataUrl: pending.dataUrl,
      filename: pending.filename,
      note: note.trim() || undefined,
    });
    setPending(null);
    setNote("");
    toast.success("Receipt attached");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-[11px] text-amber-100">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">Private — for your records only.</strong> Receipts stay
          in your Site Diary and are never shown to the client.
        </span>
      </div>
      {!pending ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-amber-300/40 bg-gradient-to-br from-amber-300/15 to-transparent p-8 transition hover:from-amber-300/25 active:scale-[0.99]"
        >
          <ReceiptIcon className="h-8 w-8 text-amber-200" />
          <span className="text-base font-bold text-white">Scan or attach receipt</span>
          <span className="text-[11px] text-white/60">Camera, gallery, or PDF — expense-ready</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <img
            src={pending.dataUrl}
            alt="Receipt preview"
            className="mx-auto max-h-64 rounded-lg object-contain"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: what was this for?"
            className="mt-3 border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPending(null);
                setNote("");
              }}
              className="text-white/70 hover:bg-white/[0.06] hover:text-white"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              className="bg-orange text-black hover:bg-orange/90"
            >
              Save receipt
            </Button>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        hidden
        onChange={(e) => onPick(e.target.files)}
      />

      <ul className="space-y-2">
        {items.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
              {e.dataUrl?.startsWith("data:image") ? (
                <img src={e.dataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/40">
                  <ReceiptIcon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/90">
                {e.filename ?? "Receipt"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-white/55">
                {e.note ?? formatTs(e.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeSiteDiaryEntry(e.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/[0.08] hover:text-red-300"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
