/**
 * QuickVoiceCard — "Speak your project" voice-first entry point at the top
 * of HomeownerForm. Orchestrates the recorder + intake hooks and swaps
 * between idle tips, live processing, error and draft-review sub-panels.
 * All heavy lifting lives in ./quick-voice/*.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

import { draftToFields } from "./quick-voice/draft-mappers";
import { DraftReviewPanel } from "./quick-voice/DraftReviewPanel";
import { ErrorPanel } from "./quick-voice/ErrorPanel";
import { ProcessingPanel } from "./quick-voice/ProcessingPanel";
import { TipsPanel } from "./quick-voice/TipsPanel";
import { VoiceRecorderButton } from "./quick-voice/VoiceRecorderButton";
import { useVoiceIntake } from "./quick-voice/use-voice-intake";
import { useVoiceRecorder } from "./quick-voice/use-voice-recorder";
import type { ApplyFields } from "./quick-voice/types";

export function QuickVoiceCard({
  onAudioCaptured,
  applyFields,
}: {
  onAudioCaptured: (blob: Blob) => void;
  applyFields: ApplyFields;
}) {
  const [applied, setApplied] = useState(false);
  const {
    processing,
    transcript,
    draft,
    errorMsg,
    processBlob,
    retryFromCache,
    updateDraft,
    reset: resetIntake,
    hasCachedBlob,
  } = useVoiceIntake();

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      onAudioCaptured(blob);
      if (blob.size < 1024) {
        toast.error("Recording was empty — please try again.");
        return;
      }
      await processBlob(blob);
    },
    [onAudioCaptured, processBlob],
  );

  const { recording, elapsedMs, levels, start, stop, resetElapsed } =
    useVoiceRecorder(handleRecordingComplete);

  const handleStart = useCallback(() => {
    setApplied(false);
    resetIntake();
    void start();
  }, [resetIntake, start]);

  const handleReset = useCallback(() => {
    setApplied(false);
    resetIntake();
    resetElapsed();
  }, [resetIntake, resetElapsed]);

  const handleRetry = useCallback(async () => {
    const { hadCache } = await retryFromCache();
    if (!hadCache) handleReset();
  }, [retryFromCache, handleReset]);

  const handleCommit = useCallback(() => {
    if (!draft) return;
    const filled = applyFields(draftToFields(draft), transcript);
    setApplied(true);
    toast.success(
      filled.length
        ? `Applied ${filled.length} ${filled.length === 1 ? "field" : "fields"} to the form.`
        : "Details applied to the form.",
    );
  }, [applyFields, draft, transcript]);

  const showIdleHelpers = !recording && !processing && !draft && !errorMsg;

  return (
    <div className="rounded-2xl border border-orange/30 bg-gradient-to-br from-orange/15 via-orange/5 to-transparent p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-orange/40 bg-orange/20 text-orange-glow">
          <Wand2 className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
            Fastest way to post
          </p>
          <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
            Speak your project
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-200 sm:text-sm">
            Describe the work in your own words — AI fills the form for you. You can still edit
            anything below.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <VoiceRecorderButton
          recording={recording}
          processing={processing}
          levels={levels}
          elapsedMs={elapsedMs}
          onStart={handleStart}
          onStop={stop}
        />
        {showIdleHelpers && (
          <span className="text-[11px] text-slate-400">
            Or fill the form manually below — your choice.
          </span>
        )}
      </div>

      {showIdleHelpers && <TipsPanel />}

      {processing && <ProcessingPanel transcript={transcript} />}

      {errorMsg && !processing && (
        <ErrorPanel
          message={errorMsg}
          canRetry={hasCachedBlob()}
          onRetry={handleRetry}
          onReset={handleReset}
        />
      )}

      {draft && !processing && (
        <DraftReviewPanel
          draft={draft}
          applied={applied}
          transcript={transcript}
          onUpdate={updateDraft}
          onCommit={handleCommit}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
