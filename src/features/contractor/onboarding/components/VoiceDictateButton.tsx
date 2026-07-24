/**
 * VoiceDictateButton — compact mic button for inline dictation.
 *
 * Uses the browser's native Web Speech API (SpeechRecognition /
 * webkitSpeechRecognition) to transcribe the user's voice live and
 * append interim + final words directly into the target textarea via
 * onAppend. While recording, a live animated waveform is rendered next
 * to the mic icon (driven by an AudioContext AnalyserNode on the same
 * microphone stream). Clicking again safely stops recognition and
 * leaves the transcribed text fully editable.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSpeechRecognition as sharedGetSR,
  micLikelyBlocked as sharedMicBlocked,
} from "@/lib/voice-processor";

interface Props {
  onAppend: (text: string) => void;
  className?: string;
  label?: string;
  lang?: string;
}

const WAVE_BARS = 14;

type SR = {
  new (): SpeechRecognitionInstance;
};
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognition(): SR | null {
  return (sharedGetSR() as unknown as SR | null) ?? null;
}

function micLikelyBlocked(): boolean {
  return sharedMicBlocked();
}

export function VoiceDictateButton({
  onAppend,
  className,
  label = "Dictate",
  lang = "en-US",
}: Props) {
  const [recording, setRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(WAVE_BARS).fill(0.12));
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFinalIndexRef = useRef<number>(0);

  useEffect(
    () => () => {
      cleanup();
    },

    [],
  );

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevels(Array(WAVE_BARS).fill(0.12));
  }

  function startWaveform(stream: MediaStream) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        const step = Math.max(1, Math.floor(data.length / WAVE_BARS));
        for (let i = 0; i < WAVE_BARS; i++) {
          const v = data[i * step] ?? 0;
          next.push(Math.max(0.12, Math.min(1, v / 180)));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* visualisation is best-effort */
    }
  }

  async function start() {
    try {
      const SRCtor = getSpeechRecognition();
      if (!SRCtor) {
        toast.error("Voice dictation isn't supported here — type your notes in the field below.");
        return;
      }
      if (micLikelyBlocked()) {
        toast.error("Microphone blocked in this preview — type in the field below to continue.");
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr) {
        console.warn("getUserMedia denied", permErr);
        toast.error("Microphone permission denied — you can still type in the field below.");
        cleanup();
        return;
      }
      streamRef.current = stream;
      startWaveform(stream);

      let recog: SpeechRecognitionInstance;
      try {
        recog = new SRCtor();
      } catch (ctorErr) {
        console.warn("SpeechRecognition unavailable", ctorErr);
        toast.error("Voice recognition unavailable — type in the field below.");
        cleanup();
        return;
      }
      recog.lang = lang;
      recog.interimResults = true;
      recog.continuous = true;
      lastFinalIndexRef.current = 0;
      let interimAppended = "";

      recog.onresult = (e) => {
        let finalDelta = "";
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const txt = res[0]?.transcript ?? "";
          if (res.isFinal) finalDelta += txt;
          else interim += txt;
        }
        if (finalDelta.trim()) {
          onAppend(finalDelta.trim());
          interimAppended = "";
        } else if (interim.trim() && interim !== interimAppended) {
          interimAppended = interim;
        }
      };
      recog.onerror = (ev) => {
        if (ev.error && ev.error !== "no-speech" && ev.error !== "aborted") {
          console.warn("SpeechRecognition error", ev.error);
          toast.error("Voice recognition error — please try again.");
        }
      };
      recog.onend = () => {
        setRecording(false);
        cleanup();
      };

      recogRef.current = recog;
      try {
        recog.start();
      } catch (startErr) {
        console.warn("recog.start failed", startErr);
        cleanup();
        toast.error("Couldn't start dictation — type in the field below.");
        return;
      }
      setRecording(true);
    } catch (err) {
      console.error("Voice dictation failed to initialise", err);
      cleanup();
      toast.error("Voice dictation unavailable — type in the field below.");
    }
  }

  function stop() {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setRecording(false);
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={recording ? stop : start}
        className={cn(
          "h-8 gap-1.5 rounded-full border-orange/40 bg-orange/10 px-3 text-xs font-semibold text-orange-glow hover:bg-orange/20 hover:text-orange-glow",
          recording && "border-red-400/60 bg-red-500/15 text-red-200 hover:bg-red-500/25",
        )}
        aria-pressed={recording}
        aria-label={recording ? "Stop dictation" : label}
      >
        {recording ? (
          <>
            <Square className="size-3.5 fill-current" /> Stop
          </>
        ) : (
          <>
            <Mic className="size-3.5" /> {label}
          </>
        )}
      </Button>
      {recording && (
        <div
          className="flex h-8 items-center gap-[2px] rounded-full border border-orange/30 bg-orange/10 px-2"
          aria-hidden="true"
        >
          {levels.map((lvl, i) => (
            <span
              key={i}
              className="block w-[2px] rounded-full bg-gradient-to-t from-orange to-orange-glow transition-[height] duration-75"
              style={{ height: `${Math.max(4, lvl * 22)}px` }}
            />
          ))}
          <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-red-500" />
        </div>
      )}
    </div>
  );
}

export default VoiceDictateButton;
