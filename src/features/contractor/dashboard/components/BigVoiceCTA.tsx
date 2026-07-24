import { ArrowUpRight, Mic } from "lucide-react";

export function BigVoiceCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl border border-orange/40 bg-gradient-to-br from-orange/25 via-orange/10 to-transparent p-4 text-left transition hover:from-orange/35"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange/30 blur-2xl animate-dash-pulse"
      />
      <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange text-black shadow-lg shadow-orange/30">
        <Mic className="h-6 w-6" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-orange/90">
          Fastest tool
        </p>
        <p className="mt-0.5 font-display text-base font-extrabold text-white">Voice to Invoice</p>
        <p className="mt-0.5 truncate text-[11px] text-white/60">
          Dictate a job — get a Finanzamt-ready invoice
        </p>
      </div>
      <ArrowUpRight className="relative h-4 w-4 text-white/70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}
