/**
 * Big mic button + live waveform / stop control shown at the top of
 * QuickVoiceCard while (not) recording.
 */
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceRecorderButton({
  recording,
  processing,
  levels,
  elapsedMs,
  onStart,
  onStop,
}: {
  recording: boolean;
  processing: boolean;
  levels: number[];
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const mm = Math.floor(elapsedMs / 60000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((elapsedMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  if (recording) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <div className="flex h-16 w-full items-center justify-center gap-[3px] rounded-2xl border border-orange/30 bg-[color:var(--navy-deep)]/60 px-4">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className="block w-[3px] rounded-full bg-gradient-to-t from-orange to-orange-glow transition-[height] duration-75"
              style={{ height: `${Math.max(8, lvl * 56)}px` }}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={onStop}
          className="h-14 w-full rounded-2xl text-base font-semibold"
        >
          <Square className="mr-2 size-5 fill-current" />
          Stop recording · {mm}:{ss}
        </Button>
        <p className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="inline-block size-2 animate-pulse rounded-full bg-red-500" />
          Listening — speak naturally
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={onStart}
      disabled={processing}
      className={cn(
        "btn-glow btn-glow-hover group relative h-20 w-full max-w-md rounded-2xl px-8 text-base font-bold tracking-tight",
        "shadow-[0_18px_50px_-12px_rgba(255,138,0,0.55)] transition-transform hover:scale-[1.015] active:scale-[0.99]",
        "disabled:cursor-wait disabled:opacity-70",
      )}
    >
      {processing ? (
        <>
          <Loader2 className="mr-3 size-6 animate-spin" />
          Understanding your project…
        </>
      ) : (
        <>
          <span className="absolute inset-0 rounded-2xl bg-orange/30 opacity-0 blur-xl transition-opacity group-hover:opacity-60" />
          <span className="relative flex items-center justify-center">
            <span className="mr-3 inline-flex size-10 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
              <Mic className="size-5" />
            </span>
            Speak your project
          </span>
        </>
      )}
    </Button>
  );
}
