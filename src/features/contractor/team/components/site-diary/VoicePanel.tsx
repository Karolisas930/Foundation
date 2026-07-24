import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Sparkles, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addSiteDiaryEntry,
  fileToDataUrl,
  removeSiteDiaryEntry,
  type SiteDiaryEntry,
} from "@/features/contractor/team/site-diary-store";
import { formatDuration, formatTs } from "./utils";

export function VoicePanel({
  job,
  entries,
}: {
  job: { id: string; title: string };
  entries: SiteDiaryEntry[];
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const items = entries.filter((e) => e.kind === "voice");

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      toast.error("Microphone not available on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dataUrl = await fileToDataUrl(blob);
        const dur = Math.round((Date.now() - startedAtRef.current) / 1000);
        addSiteDiaryEntry({
          jobId: job.id,
          jobTitle: job.title,
          kind: "voice",
          dataUrl,
          note: note.trim() || undefined,
          durationSec: dur,
        });
        stream.getTracks().forEach((t) => t.stop());
        setNote("");
        toast.success("Voice note saved");
      };
      rec.start();
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      toast.error("Couldn't access the microphone");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function saveTextNote() {
    if (!note.trim()) return;
    addSiteDiaryEntry({
      jobId: job.id,
      jobTitle: job.title,
      kind: "note",
      note: note.trim(),
    });
    setNote("");
    toast.success("Note saved");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange/25 bg-gradient-to-br from-orange/15 via-orange/5 to-transparent p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center">
          <button
            type="button"
            onClick={recording ? stop : start}
            className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-black shadow-lg transition ${
              recording
                ? "bg-red-500 shadow-red-500/40 animate-pulse"
                : "bg-orange shadow-orange/40 hover:bg-orange/90"
            }`}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-white">
          {recording ? formatDuration(elapsed) : "Tap to dictate"}
        </p>
        <p className="mt-0.5 text-[11px] text-white/55">
          Records straight to this job. No upload needed.
        </p>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
          Quick note / transcript
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Type what you'd say — attaches to the recording, or save on its own."
          className="mt-1 min-h-[80px] border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={saveTextNote}
            disabled={!note.trim()}
            className="bg-white/[0.08] text-white hover:bg-white/[0.16] disabled:opacity-40"
          >
            <Sparkles className="mr-1 h-4 w-4" /> Save note
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((e) => (
          <VoiceRow key={e.id} entry={e} />
        ))}
      </ul>
    </div>
  );
}

function VoiceRow({ entry }: { entry: SiteDiaryEntry }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange text-black hover:bg-orange/90"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90">
          Voice note · {formatDuration(entry.durationSec ?? 0)}
        </p>
        {entry.note ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] text-white/60">{entry.note}</p>
        ) : (
          <p className="mt-0.5 text-[11px] text-white/45">{formatTs(entry.createdAt)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => removeSiteDiaryEntry(entry.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/[0.08] hover:text-red-300"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {entry.dataUrl ? (
        <audio
          ref={audioRef}
          src={entry.dataUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          hidden
        />
      ) : null}
    </li>
  );
}
