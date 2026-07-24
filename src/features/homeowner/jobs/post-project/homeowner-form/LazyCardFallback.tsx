export function LazyCardFallback({ label }: { label: string }) {
  return (
    <div
      className="mb-6 rounded-xl border border-slate-800/80 bg-[#1e293b]/60 p-6 text-sm text-slate-400 shadow-xl"
      aria-busy="true"
    >
      Loading {label}…
    </div>
  );
}
