/**
 * ProfileDetailsSection — logo upload, short bio, team size,
 * minimum project size and languages multi-select.
 */
import { useRef } from "react";
import { ImagePlus, Plus, Sparkles, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_LANGUAGES } from "../profile-types";
import { SectionShell } from "./SectionShell";

type Lang = (typeof AVAILABLE_LANGUAGES)[number];

interface Props {
  editing: boolean;
  bio: string;
  setBio: (v: string) => void;
  logo: string | null;
  onPickLogo: (file?: File | null) => void;
  teamSize: number;
  setTeamSize: (v: number) => void;
  minProjectSize: number;
  setMinProjectSize: (v: number) => void;
  languages: string[];
  activeLangLabels: Lang[];
  toggleLanguage: (code: string) => void;
  onDirty: () => void;
}

export function ProfileDetailsSection({
  editing,
  bio,
  setBio,
  logo,
  onPickLogo,
  teamSize,
  setTeamSize,
  minProjectSize,
  setMinProjectSize,
  languages,
  activeLangLabels,
  toggleLanguage,
  onDirty,
}: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  return (
    <SectionShell
      id="section-details"
      icon={Sparkles}
      eyebrow="Step 5"
      title="Profile Details"
      subtitle="Logo, bio, team size, minimum project size and the languages you speak on site."
    >
      <div className="flex flex-wrap items-start gap-4">
        <button
          type="button"
          onClick={() => editing && logoInputRef.current?.click()}
          disabled={!editing}
          className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-orange/40 hover:text-orange disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Upload business logo"
        >
          {logo ? (
            <img src={logo} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="size-6" />
          )}
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPickLogo(e.target.files?.[0]);
            onDirty();
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Business logo</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Square PNG or JPG, max 5 MB. Appears on quotes, invoices and your public profile.
          </p>
        </div>
      </div>

      <div>
        <Label
          htmlFor="pfBio"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Short business bio
        </Label>
        <Textarea
          id="pfBio"
          rows={4}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            onDirty();
          }}
          readOnly={!editing}
          placeholder="Tell clients about your craft, years of experience and specialities."
          className="intake-input mt-2 min-h-28"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label
            htmlFor="pfTeamSize"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            <Users className="mr-1 inline size-3" /> Team size
          </Label>
          <Input
            id="pfTeamSize"
            type="number"
            min={1}
            max={500}
            value={teamSize}
            onChange={(e) => {
              const n = parseInt(e.target.value || "0", 10);
              if (!Number.isNaN(n)) setTeamSize(Math.max(1, Math.min(500, n)));
              onDirty();
            }}
            readOnly={!editing}
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
        <div>
          <Label
            htmlFor="pfMinProj"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Minimum project size (€)
          </Label>
          <Input
            id="pfMinProj"
            type="number"
            min={0}
            step={50}
            value={minProjectSize}
            onChange={(e) => {
              const n = parseInt(e.target.value || "0", 10);
              if (!Number.isNaN(n)) setMinProjectSize(Math.max(0, n));
              onDirty();
            }}
            readOnly={!editing}
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Languages spoken
        </Label>
        <p className="mt-1 text-xs text-slate-500">
          Pick every language you can speak with clients on site.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="intake-input mt-2 flex w-full items-center justify-between text-left"
            >
              <span className="truncate text-sm text-slate-100">
                {languages.length === 0 ? "Select languages…" : `${languages.length} selected`}
              </span>
              <Plus className="size-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 border-white/10 bg-[#0f172a] text-slate-100"
          >
            {AVAILABLE_LANGUAGES.map((l) => {
              const active = languages.includes(l.code);
              return (
                <DropdownMenuItem
                  key={l.code}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleLanguage(l.code);
                  }}
                  className="cursor-pointer focus:bg-white/10 focus:text-white"
                >
                  <span className="mr-2" aria-hidden>
                    {l.flag}
                  </span>
                  <span className="flex-1">{l.label}</span>
                  {active && <span className="text-orange">✓</span>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeLangLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeLangLabels.map((l) => (
              <span
                key={l.code}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100"
              >
                <span aria-hidden>{l.flag}</span>
                {l.label}
                <button
                  type="button"
                  aria-label={`Remove ${l.label}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLanguage(l.code);
                  }}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-orange"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
