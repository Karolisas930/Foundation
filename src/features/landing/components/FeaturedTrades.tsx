import { Link } from "@tanstack/react-router";
import { Star, ShieldCheck, Sparkles, MapPin } from "lucide-react";

type FeaturedTrade = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviews: number;
  city: string;
  bio: string;
  initials: string;
  accent: string;
  featured?: boolean;
  verified?: boolean;
};

const TRADES: FeaturedTrade[] = [
  {
    id: "schneider-elektro",
    name: "Markus Schneider",
    trade: "Electrical & Smart Home",
    rating: 4.9,
    reviews: 142,
    city: "Mannheim",
    bio: "Meister electrician — 18 years on new builds and retrofits across the Rhein-Neckar region.",
    initials: "MS",
    accent: "from-orange-500/40 to-orange-500/10",
    featured: true,
    verified: true,
  },
  {
    id: "weber-dach",
    name: "Andrea Weber",
    trade: "Roofing & Waterproofing",
    rating: 4.8,
    reviews: 96,
    city: "Heidelberg",
    bio: "Family-run roofing crew with own scaffold. Specializes in flat-roof renovation and solar prep.",
    initials: "AW",
    accent: "from-sky-400/40 to-sky-400/10",
    verified: true,
  },
  {
    id: "kraus-sanitaer",
    name: "Tobias Kraus",
    trade: "Plumbing, Heating & HVAC",
    rating: 5.0,
    reviews: 211,
    city: "Karlsruhe",
    bio: "Heat-pump conversions and bathroom rebuilds. KfW-listed installer, BAFA paperwork included.",
    initials: "TK",
    accent: "from-emerald-400/40 to-emerald-400/10",
    featured: true,
    verified: true,
  },
  {
    id: "hoffmann-tischler",
    name: "Lena Hoffmann",
    trade: "Joinery & Custom Cabinetry",
    rating: 4.9,
    reviews: 78,
    city: "Stuttgart",
    bio: "Bespoke kitchens, built-in wardrobes and staircases. Workshop in Bad Cannstatt.",
    initials: "LH",
    accent: "from-purple-400/40 to-purple-400/10",
    verified: true,
  },
  {
    id: "bauer-maler",
    name: "Stefan Bauer",
    trade: "Painting & Facades",
    rating: 4.7,
    reviews: 134,
    city: "Freiburg",
    bio: "Interior renovations and full facade refurbs. Lime-paint and historic surfaces a specialty.",
    initials: "SB",
    accent: "from-amber-400/40 to-amber-400/10",
    verified: true,
  },
  {
    id: "richter-fliesen",
    name: "Daniela Richter",
    trade: "Tiling & Natural Stone",
    rating: 4.9,
    reviews: 88,
    city: "Ulm",
    bio: "Large-format porcelain, wet rooms and stone terraces. Three-person crew, BW-wide.",
    initials: "DR",
    accent: "from-rose-400/40 to-rose-400/10",
    featured: true,
    verified: true,
  },
];

export function FeaturedTrades() {
  return (
    <section
      id="featured-trades"
      className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-3xl border border-orange/20 bg-gradient-to-br from-[#151F32]/90 via-[#0f172a]/80 to-[#151F32]/90 p-6 shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--orange)_60%,transparent)] sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-orange/15 to-transparent blur-2xl"
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Sparkles className="size-3.5" /> Featured trades
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Master-Badge pros, ready to quote
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Profiles marked with the Master-Badge are active listings cross-checked against official
            trade registries. Tap a card to open the full profile, portfolio and reviews.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRADES.map((t) => (
          <Link
            key={t.id}
            to="/p/$profileId"
            params={{ profileId: t.id }}
            className="group relative flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[#151F32]/85 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange/60 hover:shadow-[0_14px_40px_-14px_color-mix(in_oklab,var(--orange)_70%,transparent)] sm:p-5"
          >
            {t.featured && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-orange/50 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-glow">
                <Sparkles className="size-3" /> Featured
              </span>
            )}

            <div className="flex items-start gap-3">
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.accent} font-display text-lg font-extrabold text-white ring-1 ring-white/15`}
                aria-hidden
              >
                {t.initials}
              </div>
              <div className="min-w-0 flex-1 pr-16">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display text-base font-bold text-foreground group-hover:text-orange-glow">
                    {t.name}
                  </h3>
                  {t.verified && (
                    <ShieldCheck
                      className="size-3.5 shrink-0 text-orange-glow"
                      aria-label="Verified"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                  {t.trade}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Star className="size-3 fill-current" /> {t.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{t.reviews} reviews</span>
                </div>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{t.bio}</p>

            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3 text-orange/70" /> {t.city}
              </span>
              <span className="font-semibold text-orange-glow transition group-hover:text-orange">
                View profile →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
