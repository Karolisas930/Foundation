import { Languages, MapPin, Wallet, Wrench } from "lucide-react";
import type { MatchScoreBreakdown } from "./matching-engine";

/** Per-factor chips: Budget (/30), Distance (/30), Trade (/25), Language (/15). */
export function MatchBreakdown({ score }: { score: MatchScoreBreakdown }) {
  const items = [
    { icon: Wallet, label: "Budget", value: score.budget, max: 30 },
    {
      icon: MapPin,
      label: score.distanceKm !== null ? `${Math.round(score.distanceKm)} km` : "Distance",
      value: score.distance,
      max: 30,
    },
    { icon: Wrench, label: "Trade", value: score.trade, max: 25 },
    { icon: Languages, label: "Language", value: score.language, max: 15 },
  ];
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Match breakdown">
      {items.map(({ icon: Icon, label, value, max }) => {
        const pct = Math.round((value / max) * 100);
        const tone =
          pct >= 80
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : pct >= 50
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-slate-50 text-slate-500";
        return (
          <span
            key={label}
            title={`${label}: ${value}/${max}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
          >
            <Icon className="h-3 w-3" />
            {label} {pct}%
          </span>
        );
      })}
    </div>
  );
}
