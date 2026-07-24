/**
 * ProfileHeader — cover, avatar, identity strip, edit/invite buttons,
 * badges, language chips, trade/radius rows and the stats grid.
 *
 * Presentational only. All state lives in HandymanProfilePage.
 */
import { useRef } from "react";
import {
  Briefcase,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Hammer,
  ImagePlus,
  MapPin,
  Pencil,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AVAILABLE_LANGUAGES } from "@/features/contractor/onboarding/components/profile-types";

type Lang = (typeof AVAILABLE_LANGUAGES)[number];

interface ProfileHeaderProps {
  cover: string | null;
  avatar: string | null;
  fullName: string;
  businessName: string;
  joinDate: string;
  verified: boolean;
  trade: string;
  radiusKm: number;
  activeLangLabels: Lang[];
  editing: boolean;
  dirty: boolean;
  onPickCover: (file?: File | null) => void;
  onPickAvatar: (file?: File | null) => void;
  onEdit: () => void;
  onDone: () => void;
  onSave: () => void;
  onInvite: () => void;
}

export function ProfileHeader({
  cover,
  avatar,
  fullName,
  businessName,
  joinDate,
  verified,
  trade,
  radiusKm,
  activeLangLabels,
  editing,
  dirty,
  onPickCover,
  onPickAvatar,
  onEdit,
  onDone,
  onSave,
  onInvite,
}: ProfileHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const profileStats = [
    { icon: Briefcase, label: "Jobs done", value: "47" },
    { icon: Star, label: "Avg rating", value: "4.9" },
    { icon: Clock, label: "Response", value: "< 2h" },
    { icon: TrendingUp, label: "Repeat clients", value: "32%" },
  ];

  return (
    <>
      {/* Cover banner */}
      <div className="relative mt-4 h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 sm:h-52">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/50 text-white ring-1 ring-white/15 backdrop-blur hover:bg-black/70"
          aria-label="Upload cover image"
        >
          <Camera className="size-4" />
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickCover(e.target.files?.[0])}
        />
      </div>

      {/* Identity strip */}
      <div className="relative">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 px-2 sm:gap-4 sm:px-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[#0f172a] bg-slate-800 text-slate-300 shadow-lg hover:bg-slate-700 sm:size-24"
            aria-label="Upload profile picture"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="size-7" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickAvatar(e.target.files?.[0])}
          />
          {editing ? (
            dirty ? (
              <Button
                type="button"
                onClick={onSave}
                className="btn-glow btn-glow-hover h-10 shrink-0 rounded-full px-5"
              >
                <Check className="mr-1.5 size-4" /> Save Changes
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onDone}
                className="h-10 shrink-0 rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
              >
                Done
              </Button>
            )
          ) : (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onInvite}
                className="h-10 rounded-full border-white/15 bg-white/5 px-4 text-white hover:bg-white/10 hover:text-white"
              >
                <UserPlus className="mr-1.5 size-4" /> Invite colleague
              </Button>
              <Button
                type="button"
                onClick={onEdit}
                className="btn-glow btn-glow-hover h-10 rounded-full px-5"
              >
                <Pencil className="mr-1.5 size-4" /> Edit Profile
              </Button>
            </div>
          )}
        </div>

        <div id="profile" className="mt-4 min-w-0 px-2 sm:px-4">
          <h1 className="break-words font-display text-2xl font-extrabold tracking-tight text-white">
            {fullName}
          </h1>
          {businessName && <p className="truncate text-sm text-slate-400">{businessName}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
              <CalendarDays className="size-3" /> Joined {joinDate}
            </span>
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck className="size-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-glow">
                <ShieldCheck className="size-3" /> Verification pending
              </span>
            )}
          </div>

          {/*
            Languages intentionally hidden from the public profile view.
            They are still used by the matching engine and are editable in
            Profile Settings only.
          */}

          <div className="mt-4 space-y-1.5 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <Hammer className="size-4 text-orange" />
              <span className="font-semibold text-white">Trade:</span> {trade || "—"}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-orange" />
              <span className="font-semibold text-white">Einsatzradius:</span> {radiusKm} km service
              radius
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {profileStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-orange">
                  <s.icon className="size-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 font-display text-xl font-extrabold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
