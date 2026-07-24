/**
 * ProfileTabs — uppercase tracked tabs with an orange underline indicator.
 * Themed to match the homepage + homeowner intake (dark navy + orange).
 *
 * Visitor-facing tabs: Overview, Toolbelt, Performance.
 * (Edit Profile lives in the hamburger menu now.)
 */
import { cn } from "@/lib/utils";

export type ProfileTabKey =
  | "edit"
  | "overview"
  | "portfolio"
  | "toolbelt"
  | "performance"
  | "finanz";

interface ProfileTabsProps {
  active: ProfileTabKey;
  onChange: (key: ProfileTabKey) => void;
}

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "portfolio", label: "Portfolio" },
  { key: "finanz", label: "Finanz" },
];

export function ProfileTabs({ active, onChange }: ProfileTabsProps) {
  return (
    <nav role="tablist" className="mt-6 grid grid-cols-3 border-b border-white/10 px-2 sm:px-4">
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative -mb-px px-1 pb-3 pt-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] transition sm:text-xs",
              isActive ? "text-orange-glow" : "text-white/55 hover:text-white/80",
            )}
          >
            {t.label}
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-[3px] rounded-t-full transition",
                isActive ? "bg-gradient-to-r from-orange to-orange-glow" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
