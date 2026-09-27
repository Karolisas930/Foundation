/**
 * PerformanceStats — Tab 4: ratings, performance and reviews summary.
 *
 * Real-data only: no placeholder reviews or invented percentages. Values
 * arrive through props once verified, completed jobs produce them.
 */
import { Star, Repeat2, Timer, ThumbsUp, MessageSquareQuote } from "lucide-react";

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface PerformanceStatsProps {
  reviews?: Review[];
  recommendPct?: number | null;
  onTimePct?: number | null;
  repeatPct?: number | null;
}

export function PerformanceStats({
  reviews = [],
  recommendPct = null,
  onTimePct = null,
  repeatPct = null,
}: PerformanceStatsProps) {
  const hasReviews = reviews.length > 0;
  const average = hasReviews ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const pct = (v: number | null) => (v == null ? "—" : `${v}%`);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">Performance</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          Reputation & reviews
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Verified ratings from completed jobs. Higher scores surface you in homeowner searches.
        </p>
      </header>

      {/* Top metrics */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric
          icon={
            <Star
              className={hasReviews ? "size-4 fill-orange text-orange" : "size-4 text-slate-500"}
            />
          }
          label="Rating"
          value={hasReviews ? average.toFixed(1) : "—"}
          hint={hasReviews ? `${reviews.length} reviews` : "No reviews yet"}
        />
        <Metric
          icon={<ThumbsUp className="size-4" />}
          label="Recommend"
          value={pct(recommendPct)}
          hint="Would rebook"
        />
        <Metric
          icon={<Timer className="size-4" />}
          label="On time"
          value={pct(onTimePct)}
          hint="Arrivals last 30d"
        />
        <Metric
          icon={<Repeat2 className="size-4" />}
          label="Repeat"
          value={pct(repeatPct)}
          hint="Of recent jobs"
        />
      </section>

      {/* Reviews list */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-orange" />
          <h3 className="font-display text-base font-bold text-white">Recent reviews</h3>
        </div>
        {!hasReviews ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="text-sm font-medium text-white/70">No reviews yet</p>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              Reviews appear here once clients rate your completed projects.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {reviews.map((r) => (
              <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{r.author}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{r.date}</p>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < r.rating ? "fill-orange text-orange" : "text-slate-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-300">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-orange">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}
