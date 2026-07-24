/**
 * Live transcript preview shown while streaming STT is in flight.
 */
import { Loader2 } from "lucide-react";

export function ProcessingPanel({ transcript }: { transcript: string }) {
  return (
    <div className="mt-4 rounded-xl border border-orange/30 bg-[color:var(--navy-deep)]/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-glow">
        <Loader2 className="size-3 animate-spin" />
        {transcript ? "Structuring your project…" : "Transcribing live"}
      </p>
      <p className="mt-1.5 min-h-[2.5rem] text-[13px] leading-5 text-slate-100">
        {transcript ? (
          <>
            {transcript}
            <span className="ml-0.5 inline-block h-3.5 w-[2px] -translate-y-[1px] animate-pulse bg-orange-glow align-middle" />
          </>
        ) : (
          <span className="text-slate-400">Listening to your recording…</span>
        )}
      </p>
    </div>
  );
}
