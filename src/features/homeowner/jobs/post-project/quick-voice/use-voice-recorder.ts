/**
 * Encapsulates MediaRecorder + AnalyserNode wiring for QuickVoiceCard.
 * Owns the mic stream, elapsed timer and live waveform levels; delivers
 * the finished recording as a Blob via onComplete.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WAVE_BARS } from "./types";

export function useVoiceRecorder(onComplete: (blob: Blob) => void | Promise<void>) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(WAVE_BARS).fill(0.08));

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopWaveform = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(Array(WAVE_BARS).fill(0.08));
  }, []);

  const startWaveform = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        const step = Math.max(1, Math.floor(data.length / WAVE_BARS));
        for (let i = 0; i < WAVE_BARS; i++) {
          const v = data[i * step] ?? 0;
          next.push(Math.max(0.08, Math.min(1, v / 200)));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Visualisation is best-effort; recording still proceeds.
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const supported = ["audio/webm", "audio/mp4"].find(
        (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
      );
      const mr = supported
        ? new MediaRecorder(stream, { mimeType: supported })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stopWaveform();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await onComplete(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setElapsedMs(0);
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
      startWaveform(stream);
    } catch {
      toast.error("Microphone unavailable. Please allow audio access.");
    }
  }, [onComplete, startWaveform, stopWaveform]);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetElapsed = useCallback(() => setElapsedMs(0), []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { recording, elapsedMs, levels, start, stop, resetElapsed };
}
