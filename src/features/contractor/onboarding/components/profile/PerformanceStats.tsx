/**
 * PerformanceStats — Tab 4: ratings, performance and reviews summary.
 * Static demo content for now; structured so real data can be wired in
 * without touching the surrounding tab shell.
 */
import { Star, Repeat2, Timer, ThumbsUp, MessageSquareQuote } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Anja M.",
    rating: 5,
    date: "2026-06-22",
    text: "Punctual, tidy and explained every step. Booked again for the kitchen.",
  },
  {
    id: "r2",
    author: "Tobias K.",
    rating: 5,
    date: "2026-06-14",
    text: "Smart Receipt invoicing made expenses painless. Highly recommend.",
  },
  {
    id: "r3",
    author: "Lena R.",
    rating: 4,
    date: "2026-05-30",
    text: "Great work on the balcony repaint, slight delay on materials.",
  },
];

export function PerformanceStats() {
  const average = DEMO_REVIEWS.reduce((s, r) => s + r.rating, 0) / DEMO_REVIEWS.length;

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
          icon={<Star className="size-4 fill-orange text-orange" />}
          label="Rating"
          value={average.toFixed(1)}
          hint={`${DEMO_REVIEWS.length} reviews`}
        />
        <Metric
          icon={<ThumbsUp className="size-4" />}
          label="Recommend"
          value="96%"
          hint="Would rebook"
        />
        <Metric
          icon={<Timer className="size-4" />}
          label="On time"
          value="98%"
          hint="Arrivals last 30d"
        />
        <Metric
          icon={<Repeat2 className="size-4" />}
          label="Repeat"
          value="32%"
          hint="Of last 50 jobs"
        />
      </section>

      {/* Reviews list */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-orange" />
          <h3 className="font-display text-base font-bold text-white">Recent reviews</h3>
        </div>
        <ul className="divide-y divide-white/5">
          {DEMO_REVIEWS.map((r) => (
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
