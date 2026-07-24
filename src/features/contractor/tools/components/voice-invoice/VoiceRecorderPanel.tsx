/**
 * Audio capture UI — mic button, animated waveform, streaming transcript,
 * and the editable draft textarea.
 */
import { Mic, MicOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { VoiceInvoiceState } from "./useVoiceInvoice";

export function VoiceRecorderPanel({ s }: { s: VoiceInvoiceState }) {
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={s.listening ? s.stop : s.start}
            className={cn(
              "grid size-20 place-items-center rounded-full border-2 transition-all",
              s.listening
                ? "border-orange bg-orange/20 shadow-[0_0_40px_-5px_rgba(255,138,0,0.7)]"
                : "border-white/15 bg-white/5 hover:border-orange/50",
            )}
            aria-label={s.listening ? "Stop dictation" : "Start dictation"}
          >
            {s.listening ? (
              <MicOff className="size-8 text-orange" strokeWidth={1.5} />
            ) : (
              <Mic className="size-8 text-slate-200" strokeWidth={1.5} />
            )}
          </button>

          <div className="flex h-12 items-end gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={cn("w-1 rounded-full bg-orange/70", s.listening ? "tb-wave-bar" : "")}
                style={{
                  height: s.listening ? `${8 + (i % 6) * 6}px` : "6px",
                  animationDelay: `${(i % 12) * 60}ms`,
                  opacity: s.listening ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {s.listening ? "Listening…" : "Tap the mic to start"}
          </p>
          <p className="max-w-sm text-center text-[10px] text-slate-500">
            Try: <em>"14 hours plastering at 150 euro per hour"</em>,{" "}
            <em>"replace bathroom tiles for 850 euro"</em>, or{" "}
            <em>"10 hours on Sunday at 80 euro per hour"</em>.
          </p>
        </div>
      </div>

      <div className="text-orange-glow min-h-[70px] rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm">
        {s.transcript.slice(0, s.typedIdx) || (
          <span className="text-slate-500">Your dictation will stream here…</span>
        )}
        {s.typedIdx < s.transcript.length && <span className="animate-pulse">▍</span>}
      </div>

      <div>
        <Label className="text-white">Editable draft</Label>
        <Textarea
          rows={4}
          value={s.transcript}
          onChange={(e) => {
            s.setTranscript(e.target.value);
            s.setTypedIdx(e.target.value.length);
          }}
          placeholder="Click to edit the transcribed quote…"
          className="intake-input mt-2 min-h-24"
        />
      </div>
    </>
  );
}
