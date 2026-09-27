/**
 * OverviewPanel — Public-facing profile for homeowners
 * Clean, trustworthy, and designed to help trades win jobs.
 *
 * Ratings and reviews are real-data only: until verified clients submit
 * reviews for completed jobs, the panel shows honest empty states instead
 * of placeholder testimonials.
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
  MessageSquareQuote,
} from "lucide-react";

export interface ProfileReview {
  id: string;
  name: string;
  date: string;
  rating: number;
  quote: string;
}

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
  /** Real, verified client reviews. Empty until clients submit them. */
  reviews?: ProfileReview[];
  onTimePct?: number | null;
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
}

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

export function OverviewPanel({
  businessName,
  bio,
  rating,
  reviews = [],
  onTimePct = null,
  website = null,
  instagram = null,
  phone = null,
}: OverviewPanelProps) {
  const reviewCount = reviews.length;
  const hasRating = rating > 0 && reviewCount > 0;
  const channels = [
    website ? { Icon: Globe, label: "Website" } : null,
    instagram ? { Icon: Instagram, label: "Instagram" } : null,
    phone ? { Icon: Phone, label: "Phone Number" } : null,
  ].filter(Boolean) as { Icon: typeof Globe; label: string }[];

  const cardBase = "rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6";

  return (
    <div className="space-y-6 pb-8">
      {/* About + Performance — two-column balanced layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* About: 60% */}
        <div className={`${cardBase} md:col-span-3`}>
          <h3 className="font-display text-lg font-bold text-white mb-3">
            About {businessName || "this pro"}
          </h3>
          <p className="leading-relaxed text-slate-300/90 text-[15px]">
            {bio || (
              <span className="text-muted-foreground">No description added yet.</span>
            )}
          </p>

          {/* Privacy Gate — only channels the pro actually provided */}
          {channels.length > 0 && (
            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 backdrop-blur-sm">
              <div className="flex flex-col gap-2.5">
                {channels.map(({ Icon, label }) => (
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
          )}
        </div>

        {/* Performance pills: 40% — real values only */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Star
              className={
                hasRating
                  ? "size-5 fill-orange/70 text-orange/70 shrink-0"
                  : "size-5 text-white/25 shrink-0"
              }
            />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {hasRating ? rating.toFixed(1) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasRating
                  ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Award
              className={
                onTimePct != null ? "size-5 text-orange/70 shrink-0" : "size-5 text-white/25 shrink-0"
              }
            />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {onTimePct != null ? `${onTimePct}%` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {onTimePct != null ? "On-time delivery" : "No completed jobs yet"}
              </p>
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

      {/* Verified Client Reviews — real reviews only */}
      <section className={cardBase}>
        <h4 className="font-display text-lg font-bold text-white mb-4">Verified Client Reviews</h4>
        {reviewCount === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-8 text-center">
            <MessageSquareQuote className="size-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-white/70">No client reviews yet</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Reviews appear here once verified clients complete a project and rate the work.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300/90">“{r.quote}”</p>
                <p className="mt-2 text-xs font-semibold text-white/70">— {r.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
