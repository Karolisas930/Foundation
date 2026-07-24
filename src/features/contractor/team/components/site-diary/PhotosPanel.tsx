import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SITE_DIARY_PHOTO_LIMIT,
  addSiteDiaryEntry,
  fileToDataUrl,
  moveSiteDiaryEntry,
  removeSiteDiaryEntry,
  type SiteDiaryEntry,
} from "@/features/contractor/team/site-diary-store";

export function PhotosPanel({
  job,
  entries,
}: {
  job: { id: string; title: string };
  entries: SiteDiaryEntry[];
}) {
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"photo-before" | "photo-after" | null>(null);

  const before = entries.filter((e) => e.kind === "photo-before");
  const after = entries.filter((e) => e.kind === "photo-after");
  const totalPhotos = before.length + after.length;
  const remaining = Math.max(0, SITE_DIARY_PHOTO_LIMIT - totalPhotos);

  async function onPick(kind: "photo-before" | "photo-after", files: FileList | null) {
    if (!files || !files.length) return;
    if (remaining <= 0) {
      toast.error(`Photo limit reached (${SITE_DIARY_PHOTO_LIMIT} per job)`);
      return;
    }
    setBusy(kind);
    const list = Array.from(files).slice(0, remaining);
    const dropped = files.length - list.length;
    try {
      for (const f of list) {
        if (f.size > 15 * 1024 * 1024) {
          toast.error(`${f.name} is larger than 15 MB — skipped`);
          continue;
        }
        const dataUrl = await fileToDataUrl(f);
        addSiteDiaryEntry({
          jobId: job.id,
          jobTitle: job.title,
          kind,
          dataUrl,
          filename: f.name,
        });
      }
    } finally {
      setBusy(null);
    }
    if (dropped > 0) {
      toast.warning(`Only ${list.length} added — ${SITE_DIARY_PHOTO_LIMIT}-photo limit per job.`);
    } else {
      toast.success(
        `${list.length} ${kind === "photo-before" ? "before" : "after"} photo${list.length === 1 ? "" : "s"} saved`,
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/70">
        <span>
          Photos: <span className="text-white">{totalPhotos}</span> / {SITE_DIARY_PHOTO_LIMIT}
        </span>
        <span className={remaining === 0 ? "text-red-300" : "text-white/50"}>
          {remaining === 0 ? "Limit reached" : `${remaining} left`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => beforeRef.current?.click()}
          disabled={remaining === 0 || busy !== null}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/25 to-sky-500/5 p-5 text-center transition hover:from-sky-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "photo-before" ? (
            <Loader2 className="h-8 w-8 animate-spin text-sky-200" />
          ) : (
            <Camera className="h-8 w-8 text-sky-200" />
          )}
          <span className="text-sm font-bold text-white">Capture Before</span>
          <span className="text-[10px] uppercase tracking-widest text-white/55">
            {before.length} saved
          </span>
        </button>
        <button
          type="button"
          onClick={() => afterRef.current?.click()}
          disabled={remaining === 0 || busy !== null}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 p-5 text-center transition hover:from-emerald-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "photo-after" ? (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-200" />
          ) : (
            <Camera className="h-8 w-8 text-emerald-200" />
          )}
          <span className="text-sm font-bold text-white">Capture After</span>
          <span className="text-[10px] uppercase tracking-widest text-white/55">
            {after.length} saved
          </span>
        </button>
      </div>
      <PhotoRow
        label="Before"
        tone="sky"
        count={before.length}
        canAdd={remaining > 0}
        onCapture={() => beforeRef.current?.click()}
        items={before}
      />
      <input
        ref={beforeRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
          onPick("photo-before", e.target.files);
          e.target.value = "";
        }}
      />
      <PhotoRow
        label="After"
        tone="emerald"
        count={after.length}
        canAdd={remaining > 0}
        onCapture={() => afterRef.current?.click()}
        items={after}
      />
      <input
        ref={afterRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
          onPick("photo-after", e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PhotoRow({
  label,
  tone,
  count,
  canAdd,
  onCapture,
  items,
}: {
  label: string;
  tone: "sky" | "emerald";
  count: number;
  canAdd: boolean;
  onCapture: () => void;
  items: SiteDiaryEntry[];
}) {
  const ring =
    tone === "sky"
      ? "border-sky-400/30 from-sky-400/15"
      : "border-emerald-400/30 from-emerald-400/15";
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          {label}
          <span className="ml-2 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/70">
            {count}
          </span>
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={onCapture}
          disabled={!canAdd}
          className="bg-white/[0.06] text-white hover:bg-white/[0.12] disabled:opacity-40"
        >
          <Camera className="mr-1 h-4 w-4" /> Capture
        </Button>
      </div>
      {items.length === 0 ? (
        <button
          type="button"
          onClick={onCapture}
          disabled={!canAdd}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed bg-gradient-to-br to-transparent p-6 text-center disabled:cursor-not-allowed disabled:opacity-50 ${ring}`}
        >
          <Camera className="h-6 w-6 text-white/70" />
          <span className="text-sm font-semibold text-white/85">
            Tap to add {label.toLowerCase()} photos
          </span>
          <span className="text-[11px] text-white/50">Opens your camera on mobile</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((e, i) => (
            <ThumbCard key={e.id} entry={e} index={i} total={items.length} />
          ))}
        </div>
      )}
    </section>
  );
}

function ThumbCard({
  entry,
  index,
  total,
}: {
  entry: SiteDiaryEntry;
  index: number;
  total: number;
}) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(false), 2500);
    return () => window.clearTimeout(t);
  }, [confirming]);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
      {entry.dataUrl ? (
        <img
          src={entry.dataUrl}
          alt={entry.filename ?? entry.kind}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white/40">
          <CameraOff className="h-5 w-5" />
        </div>
      )}
      <span className="pointer-events-none absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white/85">
        {index + 1}
      </span>
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => moveSiteDiaryEntry(entry.id, -1)}
          disabled={index === 0}
          aria-label="Move earlier"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white/90 backdrop-blur transition disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveSiteDiaryEntry(entry.id, 1)}
          disabled={index === total - 1}
          aria-label="Move later"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white/90 backdrop-blur transition disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          removeSiteDiaryEntry(entry.id);
          toast.success("Photo removed");
        }}
        aria-label={confirming ? "Tap again to confirm delete" : "Delete photo"}
        className={`absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md backdrop-blur transition ${
          confirming
            ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
            : "bg-black/70 text-white/90 hover:bg-red-500/90"
        }`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
