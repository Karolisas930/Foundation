import { Target } from "lucide-react";

export function MatchScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? "from-emerald-400/30 to-emerald-500/10 text-emerald-200 ring-emerald-400/40"
      : score >= 75
        ? "from-orange/30 to-orange/5 text-orange ring-orange/40"
        : "from-amber-400/25 to-amber-500/5 text-amber-200 ring-amber-400/30";
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-br px-3 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 backdrop-blur ${tone}`}
      title="AI Match Score"
    >
      <Target className="size-3.5" />
      <span className="font-display text-sm font-extrabold tabular-nums">{score}%</span>
      <span className="hidden text-[10px] font-semibold opacity-80 sm:inline">match</span>
    </div>
  );
}
