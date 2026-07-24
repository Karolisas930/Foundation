/**
 * Lightweight visual shell shared by trade-side onboarding sub-forms
 * (Handyman, Business). Mirrors the homeowner intake form's dark navy
 * chrome, sticky top bar, and orange accent so the trade flow feels
 * visually consistent with the homeowner experience.
 */
import type { ReactNode } from "react";
import { TopBar } from "@/components/shared/TopBar";

interface FormShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function FormShell({ eyebrow, title, subtitle, children }: FormShellProps) {
  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid text-slate-50">
      <TopBar />

      <section className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
          {eyebrow}
        </p>
        <h1 className="mt-3 break-words font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">{subtitle}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-sm sm:p-6 md:mt-8 md:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
