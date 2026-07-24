/**
 * StaffBarChart and WeeklyBarChart — the two simple bar charts shown in the
 * Hours Overview section on the Staff Hours page.
 */

export function StaffBarChart({
  data,
  highlight,
}: {
  data: { name: string; approved: number; all: number }[];
  highlight: "approved" | "all";
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.approved, d.all)));
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Hours per staff · this month
        </h3>
        <span className="text-[10px] text-slate-500">{data.length} staff</span>
      </div>
      {data.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-500">No hours logged this month.</div>
      ) : (
        <div className="space-y-3">
          {data.map((d) => {
            const approvedPct = Math.round((d.approved / max) * 100);
            const remainingPct = Math.max(0, Math.round(((d.all - d.approved) / max) * 100));
            return (
              <div key={d.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-slate-200">{d.name}</span>
                  <span className="tabular-nums font-medium text-white">
                    {highlight === "approved" ? `${d.approved} / ${d.all} h` : `${d.all} h`}
                  </span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-emerald-400/80 transition-all"
                    style={{ width: `${approvedPct}%` }}
                    title={`${d.approved} h approved`}
                  />
                  <div
                    className="h-full bg-amber-400/50 transition-all"
                    style={{ width: `${remainingPct}%` }}
                    title={`${(d.all - d.approved).toFixed(1)} h pending/rejected`}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Approved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400/50" /> Pending / rejected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyBarChart({
  data,
  highlight,
}: {
  data: { key: string; approved: number; all: number }[];
  highlight: "approved" | "all";
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.approved, d.all)));
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Hours per week · last 6 weeks
        </h3>
        <span className="text-[10px] text-slate-500">
          {highlight === "approved" ? "Approved" : "All logged"}
        </span>
      </div>
      <div className="flex h-40 items-end gap-2">
        {data.map((d) => {
          const primary = highlight === "approved" ? d.approved : d.all;
          const primaryPct = Math.max(2, Math.round((primary / max) * 100));
          const fadedPct =
            highlight === "approved"
              ? Math.max(0, Math.round(((d.all - d.approved) / max) * 100))
              : 0;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full flex-col justify-end">
                {fadedPct > 0 && (
                  <div
                    className="w-full rounded-t-sm bg-amber-400/30"
                    style={{ height: `${fadedPct}%` }}
                  />
                )}
                <div
                  className={`w-full ${fadedPct > 0 ? "" : "rounded-t-sm"} bg-gradient-to-t from-orange-500 to-orange-400`}
                  style={{ height: `${primaryPct}%` }}
                  title={`${primary} h`}
                />
              </div>
              <span className="text-[10px] text-slate-400">{fmt(d.key)}</span>
              <span className="text-[10px] font-medium tabular-nums text-white">{primary}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
