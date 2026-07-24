/**
 * Orchestrates transcription + field extraction for a recorded audio blob.
 * Streams first, falls back to the non-streaming server fn, then extracts
 * structured fields into an editable StructuredDraft.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  extractFieldsFromTranscript,
  transcribeAndExtract,
  type VoiceIntakeFields,
} from "@/lib/voice-intake.functions";
import {
  cacheAudioBlob,
  clearAudioBlob,
  readAudioBlob,
  streamTranscribe,
  VoiceTimeoutError,
} from "@/lib/voice-processor";
import { toDraft } from "./draft-mappers";
import { blobToBase64, dedupeTranscript, extFromMime } from "./transcript-utils";
import { BLOB_CACHE_KEY, type StructuredDraft } from "./types";

async function fallbackTranscribe(blob: Blob, mimeType: string, filename: string) {
  const audioBase64 = await blobToBase64(blob);
  return transcribeAndExtract({
    data: { audioBase64, mimeType, filename },
  });
}

export function useVoiceIntake() {
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [draft, setDraft] = useState<StructuredDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processBlob = useCallback(async (blob: Blob) => {
    cacheAudioBlob(BLOB_CACHE_KEY, blob);

    setProcessing(true);
    setTranscript("");
    setErrorMsg(null);
    const mimeType = blob.type || "audio/webm";
    const filename = `voice-brief.${extFromMime(mimeType)}`;

    try {
      let transcriptText = "";
      let extractedFields: VoiceIntakeFields | null = null;
      let timedOut = false;
      try {
        transcriptText = await streamTranscribe(blob, {
          timeoutMs: 30_000,
          onDelta: (_delta, running) => setTranscript(dedupeTranscript(running)),
          onDone: (finalText) => setTranscript(dedupeTranscript(finalText)),
        });
      } catch (streamErr) {
        if (streamErr instanceof VoiceTimeoutError) {
          timedOut = true;
        } else {
          console.warn("Streaming transcription failed, falling back", streamErr);
        }
      }

      if (!transcriptText && !timedOut) {
        try {
          const result = await fallbackTranscribe(blob, mimeType, filename);
          transcriptText = (result.transcript ?? "").trim();
          extractedFields = result.fields ?? {};
          if (transcriptText) setTranscript(transcriptText);
        } catch (fallbackErr) {
          console.error("Fallback transcription failed", fallbackErr);
        }
      }

      if (!transcriptText) {
        setErrorMsg(
          timedOut
            ? "Transcription timed out. Tap Try Again to retry with the same recording."
            : "Couldn't hear anything clearly. Try again in a quieter place, or fill the form manually below.",
        );
        toast.error(timedOut ? "Transcription timed out." : "Couldn't hear anything clearly.");
        return;
      }

      if (!extractedFields) {
        try {
          const result = await extractFieldsFromTranscript({
            data: { transcript: transcriptText },
          });
          extractedFields = result.fields ?? {};
        } catch (extractErr) {
          console.error("Field extraction failed", extractErr);
          extractedFields = {};
        }
      }

      setDraft(toDraft(extractedFields, transcriptText));
      clearAudioBlob(BLOB_CACHE_KEY);
      toast.success("AI structured your project — review & post below.");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Voice brief unavailable right now — please try again or fill the form manually below.",
      );
      toast.error("Voice brief unavailable right now.");
    } finally {
      setProcessing(false);
    }
  }, []);

  const retryFromCache = useCallback(async () => {
    const cached = readAudioBlob(BLOB_CACHE_KEY);
    if (!cached) {
      toast.error("No cached recording — please record again.");
      return { hadCache: false };
    }
    await processBlob(cached);
    return { hadCache: true };
  }, [processBlob]);

  const updateDraft = useCallback(
    <K extends keyof StructuredDraft>(key: K, value: StructuredDraft[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  const reset = useCallback(() => {
    setDraft(null);
    setErrorMsg(null);
    setTranscript("");
    clearAudioBlob(BLOB_CACHE_KEY);
  }, []);

  const hasCachedBlob = useCallback(() => Boolean(readAudioBlob(BLOB_CACHE_KEY)), []);

  return {
    processing,
    transcript,
    draft,
    errorMsg,
    processBlob,
    retryFromCache,
    updateDraft,
    reset,
    hasCachedBlob,
  };
}
