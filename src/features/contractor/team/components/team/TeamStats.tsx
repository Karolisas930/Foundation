export function TeamStatsGrid({
  total,
  activeThisMonth,
  pending,
}: {
  total: number;
  activeThisMonth: number;
  pending: number;
}) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      <StatCard label="Total staff" value={total} tone="default" />
      <StatCard label="Active this month" value={activeThisMonth} tone="emerald" />
      <StatCard label="Pending invites" value={pending} tone="amber" />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "emerald" | "amber";
}) {
  const toneMap = {
    default: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
  } as const;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className={`text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </p>
    </div>
  );
}
