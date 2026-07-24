import type { ReactNode } from "react";

export function ProSection({
  id,
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-2 mt-6 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export const CATEGORY_OPTIONS = [
  "Materials",
  "Tools",
  "Fuel",
  "Vehicle",
  "Office",
  "Subcontractors",
  "Other",
] as const;
