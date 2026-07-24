/**
 * SectionShell — glass card wrapper for a single profile section.
 * Provides anchor id, eyebrow, title and subtitle in the dark navy
 * + orange theme used across the trade flow.
 */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface SectionShellProps {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SectionShell({
  id,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:p-6"
    >
      <header className="mb-5 flex items-start gap-3 border-b border-white/10 pb-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-glow">
            {eyebrow}
          </p>
          <h2 className="mt-0.5 font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-slate-400 sm:text-sm">{subtitle}</p>}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
