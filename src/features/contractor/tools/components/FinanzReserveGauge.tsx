/**
 * FinanzReserveGauge — SVG arc gauge showing tax reserve saved vs target.
 */
interface Props {
  reservePercent: number;
  netRevenueMonthEUR: number;
  reserveOnHandEUR: number;
}

export function FinanzReserveGauge({
  reservePercent,
  netRevenueMonthEUR,
  reserveOnHandEUR,
}: Props) {
  const targetEUR = (netRevenueMonthEUR * reservePercent) / 100;
  const pct = targetEUR > 0 ? Math.min(1, reserveOnHandEUR / targetEUR) : 0;
  const angle = -180 + pct * 180;
  const r = 90;
  const cx = 110;
  const cy = 110;
  const rad = (angle * Math.PI) / 180;
  const endX = cx + r * Math.cos(rad);
  const endY = cy + r * Math.sin(rad);
  const largeArc = pct > 0.5 ? 1 : 0;
  const startX = cx - r;
  const startY = cy;

  const status =
    pct >= 1 ? "On target" : pct >= 0.75 ? "Almost there" : pct >= 0.4 ? "Building" : "Short";
  const ringColor =
    pct >= 1 ? "oklch(0.75 0.15 145)" : pct >= 0.6 ? "oklch(0.78 0.20 47)" : "oklch(0.65 0.22 27)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-xs">
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="oklch(1 0 0 / 8%)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={ringColor}
            strokeWidth="16"
            strokeLinecap="round"
          />
        )}
        <text
          x="110"
          y="95"
          textAnchor="middle"
          className="fill-white"
          fontSize="26"
          fontWeight="700"
        >
          {Math.round(pct * 100)}%
        </text>
        <text x="110" y="118" textAnchor="middle" className="fill-slate-400" fontSize="11">
          {status}
        </text>
      </svg>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold text-white">
          {reserveOnHandEUR.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
        </div>
        <div className="text-xs text-slate-400">
          of{" "}
          {targetEUR.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          })}{" "}
          target ({reservePercent}% of net)
        </div>
      </div>
    </div>
  );
}
