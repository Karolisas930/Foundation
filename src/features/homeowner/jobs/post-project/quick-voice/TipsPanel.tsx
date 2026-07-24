/**
 * Idle-state hint panel: what to say for the best AI match.
 */
export function TipsPanel() {
  return (
    <div className="mt-4 rounded-xl border border-orange/20 bg-orange/5 p-3.5 sm:p-4">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
        <span aria-hidden="true">💡</span>
        Tips for a faster match:
      </p>
      <ul className="space-y-1.5 text-[11px] leading-5 text-slate-300">
        <li className="flex items-start gap-2">
          <span aria-hidden="true" className="shrink-0">
            📍
          </span>
          <span>Postal Code / Location (e.g., 68161 Mannheim)</span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden="true" className="shrink-0">
            📐
          </span>
          <span>Size & Measurements (e.g., 50 m² floor, 15 m long fence, or 2m wall height)</span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden="true" className="shrink-0">
            🛠️
          </span>
          <span>
            Material & Condition (e.g., concrete wall, oak parquet, old wallpaper removed?)
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden="true" className="shrink-0">
            📅
          </span>
          <span>Desired Timeline (e.g., as soon as possible, or next month)</span>
        </li>
      </ul>
    </div>
  );
}
