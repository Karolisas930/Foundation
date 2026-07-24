/**
 * ProjectDetailsPanel — header panel for the currently selected project.
 * Shows title, trade/location/budget, quick actions, info rows, voice
 * transcript playback and uploaded media grid.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ImageIcon,
  Languages,
  MapPin,
  MessageSquare,
  Mic,
  Pause,
  Pencil,
  Play,
  Send,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabel } from "../../dashboard/components/parts/helpers";
import { StatusPill } from "../../dashboard/components/parts/StatusPill";
import { InfoRow } from "../../dashboard/components/parts/InfoRow";
import { Panel } from "../../dashboard/components/parts/Panel";

export function ProjectDetailsPanel({
  project,
  topProposal,
  onEdit,
  onChatContractor,
}: {
  project: EcosystemProject;
  topProposal: EcosystemProposal | null;
  onEdit: () => void;
  onChatContractor: (bid: EcosystemProposal) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  function toggleTranscript(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Voice playback not supported in this browser.");
      return;
    }
    const synth = window.speechSynthesis;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    utterRef.current = u;
    synth.cancel();
    synth.speak(u);
    setPlaying(true);
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange/90">
            Active project
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-white break-words sm:text-3xl">
            {project.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Wrench className="size-3 text-orange" />
              {project.trade ?? "—"}
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-orange" />
              {project.city ?? "—"}
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-white">
              €{project.budgetTotal.toLocaleString("de-DE")}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={project.status}>{statusLabel[project.status]}</StatusPill>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-9 gap-1.5 rounded-full border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10 hover:text-white"
          >
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {topProposal && project.status !== "awarded" && (
          <button
            type="button"
            onClick={() => onChatContractor(topProposal)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-orange/40 hover:bg-orange/10 hover:text-white"
          >
            <MessageSquare className="size-3.5 text-orange" /> Chat top contractor
          </button>
        )}
        <button
          type="button"
          onClick={() => toast("Boost coming soon — your project is already prioritized.")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-orange/40 hover:bg-orange/10 hover:text-white"
        >
          <TrendingUp className="size-3.5 text-orange" /> Boost visibility
        </button>
        <button
          type="button"
          onClick={() => toast("Brief shared — link copied to clipboard.")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-orange/40 hover:bg-orange/10 hover:text-white"
        >
          <Send className="size-3.5 text-orange" /> Share brief
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <InfoRow icon={Wrench} label="Required trade">
          <span className="text-base font-semibold text-white">{project.trade ?? "—"}</span>
        </InfoRow>
        <InfoRow icon={MapPin} label="Location">
          <span className="text-base font-semibold text-white">
            {project.city ?? "—"}
            {project.locationZip ? ` — ${project.locationZip}` : ""}
          </span>
        </InfoRow>
        {project.language && (
          <InfoRow icon={Languages} label="Preferred languages">
            <span className="text-base font-semibold text-white">{project.language}</span>
          </InfoRow>
        )}

        <InfoRow icon={Sparkles} label="AI project brief">
          <p className="text-sm leading-6 text-slate-200">{project.description}</p>
        </InfoRow>

        {project.voiceTranscript && (
          <InfoRow icon={Mic} label="Voice memo transcript">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTranscript(project.voiceTranscript!)}
                className="group/play relative mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange/70 text-white shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--orange)_70%,transparent)] ring-1 ring-orange/50 transition hover:scale-105 hover:shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--orange)_80%,transparent)]"
                aria-label={playing ? "Pause" : "Play transcript"}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 rounded-full bg-orange/40 transition",
                    playing ? "animate-ping" : "opacity-0",
                  )}
                />
                {playing ? (
                  <Pause className="relative size-4" />
                ) : (
                  <Play className="relative size-4 translate-x-[1px]" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-sm italic leading-6 text-slate-200">
                  "{project.voiceTranscript}"
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  {playing
                    ? "Playing — tap to pause"
                    : "Tap to play · Auto-transcribed & translated"}
                </p>
              </div>
            </div>
          </InfoRow>
        )}
      </div>

      {project.mediaUrls && project.mediaUrls.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            <ImageIcon className="size-3.5" /> Uploaded media
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {project.mediaUrls.map((url, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
              >
                <img src={url} alt={`Project media ${i + 1}`} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
