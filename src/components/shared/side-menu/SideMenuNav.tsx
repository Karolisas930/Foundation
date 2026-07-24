import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { RouteTarget, Section } from "./menu-types";

/** Renders the collapsible list of sections and their drawer items. */
export function SideMenuNav({
  sections,
  onRoute,
}: {
  sections: Section[];
  onRoute: (target: RouteTarget) => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const openSections: Record<string, boolean> = {};
  for (const s of sections) {
    if (s.collapsible && s.heading) openSections[s.heading] = openSection === s.heading;
  }
  function toggleSection(heading: string) {
    setOpenSection((cur) => (cur === heading ? null : heading));
  }

  return (
    <>
      {sections.map((section, sIdx) => {
        const isCollapsible = !!section.collapsible && !!section.heading;
        const expanded = isCollapsible ? !!openSections[section.heading!] : true;
        return (
          <div key={sIdx}>
            {section.heading && isCollapsible ? (
              <button
                type="button"
                onClick={() => toggleSection(section.heading!)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-2 px-5 pb-1 pt-4 text-left transition hover:bg-white/[0.03]"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {section.heading}
                </span>
                <ChevronRight
                  className={
                    "h-4 w-4 shrink-0 text-white/40 transition-transform " +
                    (expanded ? "rotate-90" : "")
                  }
                  strokeWidth={1.75}
                />
              </button>
            ) : section.heading ? (
              <p className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                {section.heading}
              </p>
            ) : null}
            {expanded &&
              section.items.map((item) => {
                const Icon = item.icon;
                const isSub = item.sub === true;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => ("route" in item ? onRoute(item.route) : item.action())}
                    className={
                      isSub
                        ? "group flex w-full items-center gap-3 pl-14 pr-5 py-2 text-left transition hover:bg-white/[0.06] active:bg-white/[0.1]"
                        : "group flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-white/[0.06] active:bg-white/[0.1]"
                    }
                  >
                    <Icon
                      strokeWidth={1.5}
                      className={
                        isSub
                          ? "h-4 w-4 shrink-0 text-white/55 group-hover:text-orange-glow"
                          : "h-5 w-5 shrink-0 text-white/75 group-hover:text-orange-glow"
                      }
                    />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span
                        className={
                          isSub
                            ? "truncate text-[13px] font-medium tracking-tight text-white/70"
                            : "truncate text-[15px] font-semibold tracking-tight text-white"
                        }
                      >
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="ml-2 shrink-0">{item.badge}</span>
                      ) : item.hint ? (
                        <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            {sIdx < sections.length - 1 && <div className="mx-5 mt-3 h-px bg-white/5" />}
          </div>
        );
      })}
    </>
  );
}
