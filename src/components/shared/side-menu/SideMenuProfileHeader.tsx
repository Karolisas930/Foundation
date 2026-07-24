import { ChevronRight, UserCog, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { getInitials } from "./menu-types";

/**
 * User profile card + close button. The whole card is the "Edit Profile
 * Settings" entry point.
 */
export function SideMenuProfileHeader({
  displayName,
  displayEmail,
  avatarUrl,
  onEditSettings,
  onClose,
}: {
  displayName: string;
  displayEmail: string;
  avatarUrl?: string;
  onEditSettings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-3">
      <button
        type="button"
        onClick={onEditSettings}
        aria-label="Edit profile settings"
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.08] active:scale-[0.985] active:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
      >
        <Avatar className="h-11 w-11 border border-white/15">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
            {getInitials(displayEmail, displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight text-white">{displayName}</p>
          {displayEmail && <p className="truncate text-xs text-white/55">{displayEmail}</p>}
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 group-hover:text-orange-glow">
            <UserCog className="h-3 w-3" strokeWidth={1.75} />
            Edit Profile Settings
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/80"
          strokeWidth={1.75}
        />
      </button>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Match eligibility (Aktiv/Verbucht) toggle strip. */
export function SideMenuStatusToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-bold tracking-tight text-white">
          Status:{" "}
          <span className={active ? "text-emerald-300" : "text-amber-300"}>
            {active ? "Aktiv" : "Verbucht"}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/50">
          {active
            ? "Available for new match rotations."
            : "Hidden from new matches — current jobs unaffected."}
        </p>
      </div>
      <Switch
        checked={active}
        onCheckedChange={onChange}
        aria-label="Toggle match eligibility"
        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-amber-500/70"
      />
    </div>
  );
}
