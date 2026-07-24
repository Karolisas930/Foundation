/**
 * voice-processor — Universal audio service layer.
 *
 * Centralises browser audio capture, permission/feature-detection checks,
 * SSE streaming transcription against `/api/transcribe-stream`, and a
 * uniform streaming state (`idle | recording | processing | ready | error`)
 * shared by every voice entry point (QuickVoiceCard, VoiceDictateButton,
 * VoiceToInvoiceSheet).
 *
 * On API timeout the raw audio blob is retained in memory so callers can
 * expose a "Try Again" affordance without asking the user to re-record.
 */

export type VoiceState = "idle" | "recording" | "processing" | "ready" | "error";

export type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  try {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns true when getUserMedia is unavailable or a sandboxed iframe has
 * denied the microphone via Permissions-Policy. Callers should fall back
 * to plain-text entry rather than freezing on an impossible prompt.
 */
export function micLikelyBlocked(): boolean {
  try {
    if (typeof window === "undefined") return true;
    if (!navigator?.mediaDevices?.getUserMedia) return true;
    const inIframe = window.self !== window.top;
    if (inIframe) {
      const fp = (
        document as unknown as {
          featurePolicy?: { allowsFeature: (n: string) => boolean };
        }
      ).featurePolicy;
      if (fp && typeof fp.allowsFeature === "function" && !fp.allowsFeature("microphone")) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export async function requestMicStream(): Promise<MediaStream> {
  if (micLikelyBlocked()) {
    throw new Error("Microphone is unavailable in this context.");
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

export function filenameForMime(mime: string): string {
  const ext = mime.includes("mp4")
    ? "mp4"
    : mime.includes("mpeg")
      ? "mp3"
      : mime.includes("wav")
        ? "wav"
        : mime.includes("ogg")
          ? "ogg"
          : "webm";
  return `voice-brief.${ext}`;
}

export interface StreamTranscribeOptions {
  /** Called with each `transcript.text.delta` fragment. */
  onDelta?: (delta: string, running: string) => void;
  /** Called once with the final transcript when the SSE stream closes. */
  onDone?: (finalText: string) => void;
  /** Hard timeout in ms; on expiry the fetch is aborted. */
  timeoutMs?: number;
  /** External abort signal (Try Again cancels a previous run). */
  signal?: AbortSignal;
}

export class VoiceTimeoutError extends Error {
  constructor() {
    super("Transcription timed out");
    this.name = "VoiceTimeoutError";
  }
}

/**
 * Stream a recorded audio blob through `/api/transcribe-stream` and return
 * the concatenated transcript. Consumers get live `onDelta` callbacks so
 * text can be painted into a textarea as the model recognises it.
 */
export async function streamTranscribe(
  blob: Blob,
  opts: StreamTranscribeOptions = {},
): Promise<string> {
  const { onDelta, onDone, timeoutMs = 30_000, signal } = opts;
  const mime = blob.type || "audio/webm";
  const form = new FormData();
  form.append("file", blob, filenameForMime(mime));

  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
  const composite = anySignal([signal, timeoutCtrl.signal]);

  let res: Response;
  try {
    res = await fetch("/api/transcribe-stream", {
      method: "POST",
      body: form,
      signal: composite,
    });
  } catch (err) {
    clearTimeout(timer);
    if (timeoutCtrl.signal.aborted) throw new VoiceTimeoutError();
    throw err;
  }

  if (!res.ok || !res.body) {
    clearTimeout(timer);
    const text = await res.text().catch(() => "");
    throw new Error(text || `Transcription failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let live = "";
  let final = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            text?: string;
          };
          if (evt.type === "transcript.text.delta" && evt.delta) {
            live += evt.delta;
            onDelta?.(evt.delta, live);
          } else if (evt.type === "transcript.text.done" && evt.text) {
            final = evt.text;
          }
        } catch {
          /* ignore malformed SSE chunk */
        }
      }
    }
  } catch (err) {
    if (timeoutCtrl.signal.aborted) throw new VoiceTimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const result = (final || live).trim();
  onDone?.(result);
  return result;
}

function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) {
      ctrl.abort();
      break;
    }
    s.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  return ctrl.signal;
}

/**
 * In-memory cache for the most recent recording. Used by "Try Again"
 * buttons so a timeout doesn't force the user to re-record.
 */
const blobCache = new Map<string, Blob>();

export function cacheAudioBlob(key: string, blob: Blob): void {
  blobCache.set(key, blob);
}

export function readAudioBlob(key: string): Blob | undefined {
  return blobCache.get(key);
}

export function clearAudioBlob(key: string): void {
  blobCache.delete(key);
}
