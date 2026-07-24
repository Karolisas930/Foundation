/**
 * ProfileHeader — premium profile hero for the Trade Professional page.
 * Themed to match the homepage + homeowner intake (dark navy + orange).
 * Light-mode appearance is handled globally by src/styles/light-overrides.css
 * via the `text-white/*`, `border-white/*` and `glass-panel` utilities.
 */
import { useRef } from "react";
import { Camera, CheckCircle2, Save, ShieldCheck } from "lucide-react";
import { initials } from "@/features/contractor/onboarding/components/profile-types";
import type { AVAILABLE_LANGUAGES } from "@/features/contractor/onboarding/components/profile-types";

type Lang = (typeof AVAILABLE_LANGUAGES)[number];

export interface ProfileHeaderProps {
  fullName: string;
  businessName: string;
  trade: string;
  trades?: string[];
  city?: string;
  radiusKm: number;
  verified: boolean;
  avatar: string | null;
  cover: string | null;
  activeLangs: Lang[];
  memberSince?: string;
  dirty: boolean;
  /** Public/preview view — hides all upload affordances (banner button,
   *  logo CTA, avatar click). Uploads live in the Edit Profile settings. */
  readOnly?: boolean;
  onPickAvatar: (file?: File | null) => void;
  onPickCover: (file?: File | null) => void;
  onRemoveLanguage?: (code: string) => void;
  onSave: () => void;
}

export function ProfileHeader(p: ProfileHeaderProps) {
  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  return (
    <header className="px-4 pt-4 sm:px-6">
      {/* Cover */}
      <div className="relative">
        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.10),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.08),transparent_60%),linear-gradient(135deg,#0b1220_0%,#0f172a_100%)] sm:h-44">
          {/* Blueprint grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
            }}
          />
          {/* Diagonal blueprint accent lines */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
            aria-hidden
          >
            <defs>
              <pattern
                id="bp-diag"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(30)"
              >
                <line x1="0" y1="0" x2="0" y2="60" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bp-diag)" />
          </svg>
          {p.cover && (
            <img src={p.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {!p.readOnly && (
            <>
              <button
                type="button"
                onClick={() => coverInput.current?.click()}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/[0.15]"
                aria-label="Upload banner image"
              >
                <Camera className="size-3.5" />
                <span>Banner</span>
              </button>
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => p.onPickCover(e.target.files?.[0])}
              />

              {/* Upload Company Logo — prominent CTA in header zone */}
              {!p.avatar && (
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-white/[0.10] px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/[0.18] sm:text-sm"
                >
                  <Camera className="size-4" />
                  Upload Company Logo
                </button>
              )}
            </>
          )}

          {/* Save Changes pill */}
          {p.dirty && (
            <button
              type="button"
              onClick={p.onSave}
              className="btn-glow btn-glow-hover absolute -bottom-5 right-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <Save className="size-4" />
              Save Changes
            </button>
          )}
        </div>

        {/* Avatar overlapping the banner */}
        <div className="absolute -bottom-8 left-4 sm:left-6">
          {p.readOnly ? (
            <div
              className="grid size-20 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-white shadow-lg ring-4 ring-background sm:size-24"
              aria-label="Profile picture"
            >
              {p.avatar ? (
                <img src={p.avatar} alt="Avatar" className="size-full object-cover" />
              ) : (
                <span className="text-xl font-bold tracking-wide">{initials(p.fullName)}</span>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                className="grid size-20 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-white shadow-lg ring-4 ring-background transition hover:bg-white/[0.15] sm:size-24"
                aria-label="Upload profile picture"
              >
                {p.avatar ? (
                  <img src={p.avatar} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <span className="text-xl font-bold tracking-wide">{initials(p.fullName)}</span>
                )}
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => p.onPickAvatar(e.target.files?.[0])}
              />
            </>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="mt-12 space-y-3 px-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {p.fullName}
          </h1>
          {p.verified && (
            <CheckCircle2 className="size-4 text-orange-glow/80" aria-label="Verified" />
          )}
          {p.verified && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/[0.06] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-200"
              aria-label="HWK Stuttgart Verifiziert"
            >
              <ShieldCheck className="size-3.5" strokeWidth={1.5} />
              🛡️ HWK Stuttgart Verifiziert
            </span>
          )}
        </div>
        {p.businessName && (
          <p className="text-base font-semibold text-orange-glow">{p.businessName}</p>
        )}

        {/* Location + dynamic service radius */}
        {(p.city || p.radiusKm > 0) && (
          <p className="pt-1 text-sm text-white/75">
            {p.city && <span className="text-white/90">📍 {p.city}</span>}
            {p.city && p.radiusKm > 0 && <span className="mx-2 text-white/25">•</span>}
            {p.radiusKm > 0 && (
              <span className="text-white/90">
                🚗 Einsatzradius: <span className="font-semibold">{p.radiusKm} km</span>
              </span>
            )}
          </p>
        )}

        {/*
          Trades text line intentionally removed — the specialty category chips
          rendered by HandymanProfilePage below the header are the single source
          of truth for the trade/category display.
        */}
      </div>
    </header>
  );
}
