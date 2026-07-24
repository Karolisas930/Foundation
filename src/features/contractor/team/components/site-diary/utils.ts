import type { SiteDiaryEntry } from "@/features/contractor/team/site-diary-store";

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function labelFor(e: SiteDiaryEntry): string {
  switch (e.kind) {
    case "photo-before":
      return "Before photo";
    case "photo-after":
      return "After photo";
    case "receipt":
      return e.filename ? `Receipt · ${e.filename}` : "Receipt";
    case "voice":
      return `Voice note · ${formatDuration(e.durationSec ?? 0)}`;
    case "signature":
      return `Sign-off · ${e.signerName ?? "Customer"}`;
    case "note":
      return e.note ? e.note.slice(0, 60) : "Note";
  }
}
