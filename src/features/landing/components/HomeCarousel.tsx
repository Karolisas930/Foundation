import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Radio, Sparkles } from "lucide-react";
import { ProCard } from "./ProCard";
import type { EcosystemProject } from "@/core/demo-session";
import type { LandingPro } from "@/lib/landing-stats.functions";

type Props = {
  liveJobs: EcosystemProject[];
  pros: LandingPro[];
  verifiedPros: LandingPro[];
  cityFilter?: string;
  onCityChange: (city?: string) => void;
};

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

function ProsSlide({
  pros,
  icon,
  chip,
  title,
  empty,
  live,
}: {
  pros: LandingPro[];
  icon: ReactNode;
  chip: string;
  title: string;
  empty: string;
  live?: boolean;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            {icon} {chip}
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        </div>
        {live && (
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-glow">
            <span className="live-dot" /> {pros.length}
          </span>
        )}
      </div>
      <ul className="mt-5 grid flex-1 grid-cols-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {pros.map((p) => (
          <li key={p.id}>
            <ProCard pro={p} />
          </li>
        ))}
        {pros.length === 0 && (
          <li className="col-span-full rounded-xl border border-dashed border-border bg-card/90 p-6 text-center text-xs text-muted-foreground">
            {empty}
          </li>
        )}
      </ul>
    </div>
  );
}

export function HomeCarousel({ liveJobs, pros, verifiedPros, cityFilter, onCityChange }: Props) {
  void liveJobs;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  const slides: { label: string; node: ReactNode }[] = [
    {
      label: "Newly registered trades",
      node: (
        <ProsSlide
          pros={pros}
          live
          icon={<Radio className="size-3.5" />}
          chip="Live now"
          title="Newly registered trades"
          empty="No trades registered yet — join as a trade professional."
        />
      ),
    },
    {
      label: "Verified Meister Pros",
      node: (
        <ProsSlide
          pros={verifiedPros}
          icon={<Sparkles className="size-3.5" />}
          chip="Verified"
          title="Verified Meister Pros"
          empty="No fully verified pros yet."
        />
      ),
    },
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
