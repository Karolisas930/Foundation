export function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "sky" | "emerald" | "orange";
}) {
  const toneCls =
    tone === "sky"
      ? "text-sky-200"
      : tone === "emerald"
        ? "text-emerald-200"
        : tone === "orange"
          ? "text-orange-200"
          : "text-slate-100";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}
