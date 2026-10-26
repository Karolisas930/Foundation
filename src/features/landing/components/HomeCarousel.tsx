import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Quote,
} from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";

type Props = {
  liveJobs: EcosystemProject[];
  cityFilter?: string;
  onCityChange: (city?: string) => void;
};

const statusTone: Record<EcosystemProject["status"], string> = {
  open: "border-orange/40 bg-orange/10 text-orange-700 dark:text-orange-glow",
  clarifying: "border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-200",
  awarded: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  completed: "border-border bg-muted text-muted-foreground",
};

const TRADES = [
  {
    id: "schneider-elektro",
    name: "Markus Schneider",
    trade: "Electrical & Smart Home",
    city: "Mannheim",
    rating: 4.9,
    reviews: 142,
    initials: "MS",
  },
  {
    id: "weber-dach",
    name: "Andrea Weber",
    trade: "Roofing & Waterproofing",
    city: "Heidelberg",
    rating: 4.8,
    reviews: 96,
    initials: "AW",
  },
  {
    id: "kraus-sanitaer",
    name: "Tobias Kraus",
    trade: "Plumbing, Heating & HVAC",
    city: "Karlsruhe",
    rating: 5.0,
    reviews: 211,
    initials: "TK",
  },
  {
    id: "hoffmann-tischler",
    name: "Lena Hoffmann",
    trade: "Joinery & Custom Cabinetry",
    city: "Stuttgart",
    rating: 4.9,
    reviews: 78,
    initials: "LH",
  },
];

const REVIEWS = [
  {
    quote:
      "The Voice Intake concept is a game changer. Being able to just speak a job and have it structured automatically will save hours of typing.",
    name: "Markus T.",
    role: "Beta Tester · Homeowner",
  },
  {
    quote:
      "Looking forward to a clean job feed filtered purely by radius and actual trade skill. No more sorting through massive spam portals.",
    name: "Andreas K.",
    role: "Beta Tester · Master Electrician",
  },
  {
    quote:
      "Transparent quotes and direct chat before any contract is exactly what the craft market needs. Excited to see it launch.",
    name: "Sarah M.",
    role: "Core Concept · Renovation Planner",
  },
];

export const PARTNERS = [
  "• Region Stuttgart",
  "• Region Heidelberg",
  "• Stadt Mannheim",
  "• Baden-Württemberg",
];

export function PartnerStrip() {
  return (
    <div className="overflow-hidden marquee-mask">
      <div className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Active Recruitment Regions
      </div>
      <div className="mt-4 flex marquee-track gap-12 whitespace-nowrap">
        {[...PARTNERS, ...PARTNERS].map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="font-display text-lg font-bold tracking-tight text-foreground/55 transition hover:text-orange-glow"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function JobsSlide({ liveJobs }: { liveJobs: EcosystemProject[] }) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Radio className="size-3.5" /> Live now
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
            Live BW job feed
          </h2>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-glow">
          <span className="live-dot" /> {liveJobs.length}
        </span>
      </div>
      <ul className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {liveJobs.slice(0, 6).map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-border bg-card/90 p-3.5 transition hover:border-orange/50 hover:bg-accent/80"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[10px] tracking-wider text-muted-foreground">
                {p.id}
              </span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone[p.status]}`}
              >
                {p.status}
              </span>
            </div>
            <div className="mt-1 break-words text-sm font-semibold text-foreground">{p.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-orange/70" />
              <span>
                {p.city ?? "BW"} · {p.locationZip}
                {p.trade ? ` · ${p.trade}` : ""}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold text-orange-glow">
              € {p.budgetTotal.toLocaleString("de-DE")}{" "}
              <span className="text-muted-foreground">budget</span>
            </div>
          </li>
        ))}
        {liveJobs.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-card/90 p-6 text-center text-xs text-muted-foreground">
            No live jobs yet — be the first to post.
          </li>
        )}
      </ul>
    </div>
  );
}

function TradesSlide() {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
          <Sparkles className="size-3.5" /> Featured trades
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
          Master-Badge pros, ready to quote
        </h2>
      </div>
      <div className="mt-5 grid flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {TRADES.map((t) => (
          <Link
            key={t.id}
            to="/p/$profileId"
            params={{ profileId: t.id }}
            className="group flex min-w-0 flex-col rounded-xl border border-border bg-card/90 p-4 transition hover:-translate-y-0.5 hover:border-orange/60 hover:bg-accent/80"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-orange/15 font-display text-sm font-extrabold text-orange-glow ring-1 ring-orange/30">
                {t.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display text-sm font-bold text-foreground group-hover:text-orange-glow">
                    {t.name}
                  </h3>
                  <ShieldCheck className="size-3.5 shrink-0 text-orange-glow" />
                </div>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">
                  {t.trade}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                    <Star className="size-3.5 fill-current" /> {t.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{t.city}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReviewsSlide() {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
          <Star className="size-3.5" /> Beta feedback
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
          Built with feedback from <span className="text-orange-glow">local pros & homeowners</span>
        </h2>
      </div>
      <div className="mt-5 min-w-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <figure
              key={i}
              className="relative flex min-w-0 flex-col rounded-xl border border-border bg-card/90 p-4 sm:p-5"
            >
              <Quote className="absolute right-3 top-3 size-5 text-orange/30 sm:size-6" />
              <div className="flex flex-wrap gap-0.5 text-orange-600 dark:text-orange">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-3.5 fill-current sm:size-4" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 break-words text-sm leading-relaxed text-foreground/80 sm:text-base sm:leading-6">
                "{r.quote}"
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3">
                <div className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  {r.name}
                </div>
                <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {r.role}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeCarousel({ liveJobs, cityFilter, onCityChange }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  const slides: { label: string; node: ReactNode }[] = [
    { label: "Live BW job feed", node: <JobsSlide liveJobs={liveJobs} /> },
    { label: "Master-Badge pros, ready to quote", node: <TradesSlide /> },
    { label: "Beta feedback", node: <ReviewsSlide /> },
  ];

  // Suppress unused warnings (city filter reserved for future in-slide control)
  void cityFilter;
  void onCityChange;

  const scrollTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative">
      <div className="flex min-h-[520px] w-full flex-col rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
        <div
          ref={trackRef}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="h-full w-full shrink-0 snap-center p-6 sm:p-8"
              aria-hidden={index !== i}
            >
              {s.node}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${s.label}`}
            onClick={() => scrollTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              index === i
                ? "w-8 bg-orange shadow-[0_0_14px_rgba(249,115,22,0.65)]"
                : "w-2.5 border border-border bg-muted hover:border-orange/50 hover:bg-accent"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollTo(index - 1)}
        disabled={index === 0}
        aria-label="Previous"
        className="absolute -left-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 p-2.5 text-foreground/80 backdrop-blur transition hover:border-orange hover:text-orange-glow disabled:opacity-30 md:inline-flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollTo(index + 1)}
        disabled={index === slides.length - 1}
        aria-label="Next"
        className="absolute -right-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 p-2.5 text-foreground/80 backdrop-blur transition hover:border-orange hover:text-orange-glow disabled:opacity-30 md:inline-flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
