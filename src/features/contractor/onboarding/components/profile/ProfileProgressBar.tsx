/**
 * ProfileProgressBar — sticky in-section progress bar with anchor links
 * to each profile sub-section. Mirrors the handyman onboarding form's
 * progress affordance and lets users jump between sections smoothly.
 */
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileSectionMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  complete: boolean;
}

interface ProfileProgressBarProps {
  sections: ProfileSectionMeta[];
}

export function ProfileProgressBar({ sections }: ProfileProgressBarProps) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const completed = sections.filter((s) => s.complete).length;
  const percent = sections.length === 0 ? 0 : Math.round((completed / sections.length) * 100);

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-2 z-30 -mx-2 mb-5 rounded-2xl border border-white/10 bg-[#0f172a]/85 p-3 shadow-xl backdrop-blur-md sm:mx-0 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          Profile completion
        </p>
        <span className="text-xs font-semibold text-slate-200">
          {completed} / {sections.length} · {percent}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange to-orange-glow transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <nav className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className={cn(
                "group flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                isActive
                  ? "border-orange/60 bg-orange/15 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-orange/40 hover:text-white",
              )}
            >
              <s.icon
                className={cn(
                  "size-3.5",
                  isActive ? "text-orange" : "text-slate-400 group-hover:text-orange",
                )}
              />
              <span className="whitespace-nowrap">{s.label}</span>
              {s.complete && (
                <span aria-hidden className="ml-0.5 size-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
