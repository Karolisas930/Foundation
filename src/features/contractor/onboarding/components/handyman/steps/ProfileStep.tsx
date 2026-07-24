/**
 * ProfileStep — Step 5. Avatar/logo upload, team size, minimum project
 * value, bio (with voice dictation), spoken languages, and Meisterpflicht
 * disclosure block.
 */
import { AlertTriangle, Upload, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_LANGUAGES,
  CARD_CLS,
  HEADER_CLS,
  MIN_PROJECT_PRESETS,
  TEAM_PRESETS,
} from "@/features/contractor/onboarding/components/onboarding-constants";
import { VoiceDictateButton } from "@/features/contractor/onboarding/components/VoiceDictateButton";
import { LanguageGrid } from "@/features/contractor/onboarding/components/LanguageGrid";

interface Props {
  avatarPreview: string | null;
  teamSize: number;
  minProjectSize: number;
  bio: string;
  languages: string[];
  setAvatarPreview: (v: string | null) => void;
  setTeamSize: (v: number) => void;
  setMinProjectSize: (v: number) => void;
  setBio: (updater: (cur: string) => string) => void;
  setBioValue: (v: string) => void;
  onToggleLanguage: (code: string) => void;
}

export function ProfileStep({
  avatarPreview,
  teamSize,
  minProjectSize,
  bio,
  languages,
  setAvatarPreview,
  setTeamSize,
  setMinProjectSize,
  setBio,
  setBioValue,
  onToggleLanguage,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLangLabels = AVAILABLE_LANGUAGES.filter((l) => languages.includes(l.code));

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large — please choose a file under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  return (
    <section id="profile" className={CARD_CLS}>
      <h2 className={HEADER_CLS}>Profile</h2>

      {/* Logo / picture */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-white">
          Profile picture or company logo <span className="text-orange">*</span>
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          Notice for commercial profiles: please upload a professional photo of yourself or your
          official company logo. A trustworthy presence significantly improves your booking rate
          with clients.
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={avatarPreview ? "Replace profile picture" : "Upload profile picture"}
            className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-orange/30 bg-[color:var(--navy-deep)]/50 grid place-items-center shadow-[0_0_30px_-10px_rgba(255,138,0,0.6)] transition hover:border-orange/60 hover:bg-orange/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Upload className="size-6 text-slate-400" />
            )}
          </button>
          <div className="flex-1">
            <p className="text-xs text-slate-400">
              PNG, JPG or WEBP · max 5 MB · square images crop best
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? "Replace image" : "Choose image"}
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarPreview(null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickAvatar}
            />
          </div>
        </div>
      </div>

      {/* Team size & min project size */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="teamSize" className="text-white">
            Team size
          </Label>
          <Input
            id="teamSize"
            type="number"
            min={1}
            max={500}
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value) || 1)}
            placeholder="e.g. 4"
            className="intake-input mt-2"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEAM_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTeamSize(n)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                  teamSize === n
                    ? "border-orange/60 bg-orange/15 text-orange-glow"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
                )}
              >
                {n === 1 ? "Solo" : `${n}+`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="minProjectSize" className="text-white">
            Minimum project size (&euro;)
          </Label>
          <Input
            id="minProjectSize"
            type="number"
            min={0}
            step={100}
            value={minProjectSize}
            onChange={(e) => setMinProjectSize(Number(e.target.value) || 0)}
            placeholder="e.g. 1000"
            className="intake-input mt-2"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MIN_PROJECT_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMinProjectSize(n)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                  minProjectSize === n
                    ? "border-orange/60 bg-orange/15 text-orange-glow"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
                )}
              >
                €{n.toLocaleString("de-DE")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="bio" className="text-white">
            Short bio (optional)
          </Label>
          <VoiceDictateButton
            label="Dictate bio"
            onAppend={(t) =>
              setBio((cur) => (cur ? `${cur.trim()} ${t}`.slice(0, 1200) : t.slice(0, 1200)))
            }
          />
        </div>
        <Textarea
          id="bio"
          rows={4}
          maxLength={1200}
          value={bio}
          onChange={(e) => setBioValue(e.target.value)}
          placeholder="Years of experience, specialities, certifications…"
          className="intake-input min-h-28 mt-2"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400 tabular-nums">
          {bio.length} / 1200
        </p>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-white">Languages Spoken / Crew Communication</Label>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {languages.length} / {AVAILABLE_LANGUAGES.length}
          </span>
        </div>
        <LanguageGrid
          languages={AVAILABLE_LANGUAGES}
          selected={languages}
          onToggle={onToggleLanguage}
        />
        {activeLangLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
            {activeLangLabels.map((l) => (
              <span
                key={l.code}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100"
              >
                <span>{l.flag}</span>
                {l.label}
                <button
                  type="button"
                  onClick={() => onToggleLanguage(l.code)}
                  aria-label={`Remove ${l.label}`}
                  className="rounded-full p-0.5 hover:bg-white/10"
                >
                  <X className="size-3 text-slate-400 hover:text-orange" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Meisterpflicht note */}
      <div className="flex items-start gap-3 rounded-lg border border-orange/30 bg-orange/5 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange" />
        <div className="space-y-1 text-xs text-slate-300">
          <p className="flex items-center gap-1.5 font-semibold text-white">
            Meisterpflicht (regulated trades)
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="About the Meister document disclaimer"
                  className="grid size-4 place-items-center rounded-full border border-orange/40 text-[10px] font-bold text-orange-glow hover:bg-orange/10"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#0f172a] text-slate-100 border border-white/10">
                Your Handwerkskarte / Meister certificate is stored encrypted and shown only to
                verification reviewers. We never share it with homeowners or third parties. You
                remain legally responsible for the validity of the documents you upload.
              </TooltipContent>
            </Tooltip>
          </p>
          <p>
            If any of your selected trades is regulated in Germany, you can continue without
            documents now. Upload your Handwerkskarte later from your profile to earn the verified
            badge and unlock higher-value jobs.
          </p>
        </div>
      </div>
    </section>
  );
}
