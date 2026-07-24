export function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 sm:px-3">
      <div className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold text-white">
        €{value.toLocaleString("de-DE")}
      </div>
    </div>
  );
}
