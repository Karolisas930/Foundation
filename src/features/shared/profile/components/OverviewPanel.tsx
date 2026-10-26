/**
 * OverviewPanel — Public-facing profile for homeowners
 * Clean, trustworthy, and designed to help trades win jobs.
 */
import {
  Star,
  Award,
  Image as ImageIcon,
  Camera,
  Lock,
  Globe,
  Instagram,
  Phone,
} from "lucide-react";

interface OverviewPanelProps {
  businessName: string;
  trade: string;
  trades?: string[];
  city: string;
  bio: string;
  radiusKm: number;
  rating: number;
  jobsCompleted: number;
  joinedDate: string;
}

type DemoReview = {
  name: string;
  date: string;
  rating: number;
  quote: string;
};

const DEMO_REVIEWS: DemoReview[] = [
  {
    name: "Anna M.",
    date: "May 2026",
    rating: 5,
    quote:
      "Punctual, tidy and clearly explained every step. The finish looks better than we imagined.",
  },
  {
    name: "Julian K.",
    date: "April 2026",
    rating: 5,
    quote: "Great communication from the first quote to the final walkthrough. Would hire again.",
  },
  {
    name: "Sophie R.",
    date: "March 2026",
    rating: 4,
    quote: "Fair pricing, professional crew, and they left the site spotless. Highly recommend.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(value) ? "size-4 fill-orange/70 text-orange/70" : "size-4 text-white/20"
          }
        />
      ))}
    </div>
  );
}

export function OverviewPanel({ businessName, bio, rating, jobsCompleted }: OverviewPanelProps) {
  const displayRating = rating > 0 ? rating : 4.9;
  const reviewCount = jobsCompleted > 0 ? jobsCompleted : DEMO_REVIEWS.length;
  const onTimePct = 98;

  const cardBase = "rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6";

  return (
    <div className="space-y-6 pb-8">
      {/* About + Performance — two-column balanced layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* About: 60% */}
        <div className={`${cardBase} md:col-span-3`}>
          <h3 className="font-display text-lg font-bold text-white mb-3">About {businessName}</h3>
          <p className="leading-relaxed text-slate-300/90 text-[15px]">{bio}</p>

          {/* Privacy Gate — locked contact channels */}
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2.5">
              {[
                { Icon: Globe, label: "Website" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Phone, label: "Phone Number" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-white/35">
                  <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
                  <span className="underline decoration-white/15 underline-offset-4">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 border-t border-white/[0.05] pt-3 text-[12px] text-white/55">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-white/50" strokeWidth={1.5} />
              <p className="leading-relaxed">
                🔒 Contact details will be unlocked after mutual acceptance of the offer.
              </p>
            </div>
          </div>
        </div>

        {/* Performance pills: 40% */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Star className="size-5 fill-orange/70 text-orange/70 shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {displayRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Award className="size-5 text-orange/70 shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {onTimePct}%
              </div>
              <p className="text-xs text-muted-foreground">On-time delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Before & After Gallery */}
      <section className={cardBase}>
        <h4 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="size-5 text-orange/70" /> Before & After Gallery
        </h4>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              {(["Before", "After"] as const).map((slot) => (
                <div
                  key={slot}
                  className="relative aspect-[4/3] flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-slate-900/40"
                >
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {slot}
                  </span>
                  <Camera className="size-6 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">No photos uploaded yet</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Completed project photos appear here as the pro adds them from their portfolio.
        </p>
      </section>

      {/* Verified Client Reviews */}
      <section className={cardBase}>
        <h4 className="font-display text-lg font-bold text-white mb-4">Verified Client Reviews</h4>
        <ul className="space-y-3">
          {DEMO_REVIEWS.map((r) => (
            <li key={r.name} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/90">“{r.quote}”</p>
              <p className="mt-2 text-xs font-semibold text-white/70">— {r.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
