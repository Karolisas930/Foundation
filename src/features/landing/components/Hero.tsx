import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, BadgeCheck, HardHat, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadge } from "./shared";

export function Hero({
  verifiedTrades,
  openCount,
  bwCoverage,
}: {
  verifiedTrades: number;
  openCount: number;
  bwCoverage: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="relative mx-auto max-w-3xl text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-16 -z-10 h-[420px] opacity-80"
      >
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-orange/25 blur-3xl" />
        <div className="absolute left-[20%] top-24 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute right-[15%] top-32 h-44 w-44 rounded-full bg-orange-glow/15 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="heroDots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroDots)" />
        </svg>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
        <span className="live-dot" />
        Live · Baden-Württemberg
      </div>

      <h1 className="mt-7 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:mt-8 sm:text-6xl">
        {t("hero.line1")}
        <br />
        <span className="bg-gradient-to-r from-orange-glow via-orange to-orange-glow bg-clip-text text-transparent">
          {t("hero.line2")}
        </span>
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-foreground/70 sm:mt-7 sm:text-lg sm:leading-8">
        A construction-grade marketplace for Mannheim, Heidelberg, Karlsruhe, Stuttgart and
        Freiburg. Post a project in 60 seconds — local trades respond the same day with quotes and
        clarifying questions.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4 sm:mt-10">
        <Button
          asChild
          size="lg"
          className="btn-glow btn-glow-hover h-13 px-7 text-sm font-semibold sm:h-14 sm:px-8 sm:text-base animate-pulse shadow-[0_0_25px_rgba(249,115,22,0.5)] border border-orange-500"
        >
          <Link to="/onboarding/profile" search={{ sector: "homeowner" }}>
            Post your project <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-13 border-border bg-background/80 px-7 text-sm font-semibold text-foreground hover:border-orange/50 hover:bg-accent hover:text-orange-glow sm:h-14 sm:px-8 sm:text-base"
        >
          <Link to="/onboarding/profile" search={{ sector: "handyman" }}>
            Join as a trade
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <TrustBadge
          icon={BadgeCheck}
          label="Verified Trade Gate"
          info="Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring."
        />
        <TrustBadge icon={Lock} label="GDPR · EU-hosted" />
        <TrustBadge
          icon={HardHat}
          label="Insurance self-declared"
          info="Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring."
        />
      </div>

      <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-2 text-sm font-semibold text-orange-glow">
        <span className="live-dot" />
        Now open for registration in Baden-Württemberg.
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            value: verifiedTrades.toLocaleString("de-DE"),
            label: "Verified Master Pros",
            cta: "Search directory →",
            delay: 0,
          },
          {
            value: `${openCount}+`,
            label: "Live BW Projects",
            cta: "Open live feed →",
            delay: 0.6,
          },
          {
            value: `${bwCoverage} cities`,
            label: "Hero Coverage",
            cta: "Filter by city →",
            delay: 1.2,
          },
        ].map((s) => (
          <Link
            key={s.label}
            to="/search"
            className="group relative overflow-hidden rounded-2xl glass-panel glass-panel-hover bg-[#111424] border-slate-800/80 p-5 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--orange)_55%,transparent)] hover:backdrop-blur-md"
          >
            <span
              aria-hidden
              className="ai-halo-bg opacity-40 transition-opacity duration-500 group-hover:opacity-75"
            />
            <span
              aria-hidden
              className="qp-sheen opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            >
              <span className="qp-sheen-bar" style={{ ["--qp-delay" as string]: `${s.delay}s` }} />
            </span>
            <div className="relative z-10">
              <div className="font-display text-3xl font-black tracking-tight text-foreground transition-transform duration-500 group-hover:scale-[1.03]">
                <span className="bg-gradient-to-r from-foreground via-foreground to-orange-glow dark:from-white dark:via-white dark:to-orange-glow bg-clip-text text-transparent">
                  {s.value}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-orange-glow">
                {s.label}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground transition group-hover:text-foreground/80">
                <span>{s.cta.replace(" →", "")}</span>
                <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
