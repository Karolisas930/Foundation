import { LogOut } from "lucide-react";

/** Sign-out row + brand/legal footer strip. */
export function SideMenuFooter({
  signedIn,
  onSignOut,
  onNavigate,
}: {
  signedIn: boolean;
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  return (
    <>
      {signedIn && (
        <>
          <div className="my-3 h-px bg-white/10" />
          <button
            type="button"
            onClick={onSignOut}
            className="group flex items-center gap-4 px-5 py-3 text-left transition hover:bg-white/[0.06] active:bg-white/[0.1]"
          >
            <LogOut
              className="h-5 w-5 text-white/75 group-hover:text-orange-glow"
              strokeWidth={1.5}
            />
            <span className="text-[15px] font-semibold tracking-tight text-white">Log out</span>
          </button>
        </>
      )}
      <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-[11px] text-white/45">
        <div>HANDWERK · Trade Professional</div>
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <a href="/impressum" onClick={onNavigate} className="hover:text-white/70 hover:underline">
            Impressum
          </a>
          <span aria-hidden className="text-white/20">
            ·
          </span>
          <a
            href="/datenschutz"
            onClick={onNavigate}
            className="hover:text-white/70 hover:underline"
          >
            Datenschutz
          </a>
        </div>
      </div>
    </>
  );
}
