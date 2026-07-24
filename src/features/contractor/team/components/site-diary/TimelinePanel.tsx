import { useMemo } from "react";
import { Camera, Mic, PenLine, Receipt as ReceiptIcon, Sparkles } from "lucide-react";
import type { SiteDiaryEntry, SiteDiaryKind } from "@/features/contractor/team/site-diary-store";
import { formatTs, labelFor } from "./utils";

export function TimelinePanel({ entries }: { entries: SiteDiaryEntry[] }) {
  const sorted = useMemo(() => [...entries].sort((a, b) => b.createdAt - a.createdAt), [entries]);
  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/60">
        Nothing captured yet for this job.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {sorted.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
        >
          <KindIcon kind={e.kind} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/90">{labelFor(e)}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/55">
              {formatTs(e.createdAt)}
              {e.note ? ` · ${e.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function KindIcon({ kind }: { kind: SiteDiaryKind }) {
  const map: Record<SiteDiaryKind, React.ComponentType<{ className?: string }>> = {
    "photo-before": Camera,
    "photo-after": Camera,
    receipt: ReceiptIcon,
    voice: Mic,
    signature: PenLine,
    note: Sparkles,
  };
  const Icon = map[kind];
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/85">
      <Icon className="h-4 w-4" />
    </span>
  );
}
