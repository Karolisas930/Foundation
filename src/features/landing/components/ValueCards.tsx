import {
  ArrowRight,
  BadgeCheck,
  Info,
  Mic,
  ShieldCheck,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const COVERED_INFO =
  "Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring.";

function QuickPropDecor({ variant }: { variant?: "spark" | "shield" | "voice" }) {
  if (variant === "spark") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 grid size-8 place-items-center"
      >
        <span className="absolute inset-0 rounded-full border border-orange/20" />
        <span className="absolute inset-1.5 rounded-full border border-orange/10" />
        <span className="qp-spark absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-glow shadow-[0_0_10px_2px_color-mix(in_oklab,var(--orange-glow)_70%,transparent)]" />
      </span>
    );
  }
  if (variant === "shield") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 h-8 w-8 overflow-hidden rounded-md border border-orange/15 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklab,var(--orange-glow)_25%,transparent),transparent_60%)]"
      >
        <span className="qp-scan absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-glow to-transparent" />
        <span className="absolute inset-0 grid place-items-center text-[9px] font-bold tracking-widest text-orange-glow/70">
          ✓
        </span>
      </span>
    );
  }
  if (variant === "voice") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 flex h-8 items-end gap-0.5"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="qp-eq-bar w-[3px] rounded-sm bg-gradient-to-t from-orange to-orange-glow"
            style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </span>
    );
  }
  return null;
}

function QuickProp({
  icon: Icon,
  title,
  body,
  info,
  variant,
  delay = 0,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  info?: string;
  variant?: "spark" | "shield" | "voice";
  delay?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass-card p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-[0_18px_50px_-24px_color-mix(in_oklab,var(--orange)_60%,transparent)]">
      {/* animated conic border */}
      <span
        aria-hidden
        className="ai-halo-bg opacity-30 transition-opacity duration-500 group-hover:opacity-70"
      />
      {/* diagonal sheen */}
      <span
        aria-hidden
        className="qp-sheen opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <span className="qp-sheen-bar" style={{ ["--qp-delay" as string]: `${delay}s` }} />
      </span>
      {/* per-variant decoration */}
      <QuickPropDecor variant={variant} />

      <div className="relative z-10 flex items-center gap-3 pr-10">
        <span className="qp-pulse grid size-9 shrink-0 place-items-center rounded-lg border border-orange/30 bg-orange/10 text-orange-glow transition-transform duration-500 group-hover:scale-105 group-hover:rotate-[-4deg]">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-display text-sm font-bold text-white">{title}</div>
            {info && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${title} — more info`}
                    className="shrink-0 text-white/45 hover:text-orange-glow"
                  >
                    <Info className="size-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-xs leading-5">{info}</PopoverContent>
              </Popover>
            )}
          </div>
          <div className="text-[12px] text-white/55">{body}</div>
        </div>
      </div>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  stat,
  statLabel,
  highlight,
  info,
  bullets,
  variant,
  delay = 0,
}: {
  icon: typeof ShieldCheck;
  eyebrow: string;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
  highlight?: boolean;
  info?: string;
  bullets?: string[];
  variant?: "spark" | "shield" | "voice";
  delay?: number;
}) {
  return (
    <article
      className={
        "group relative overflow-hidden rounded-2xl glass-panel glass-panel-hover p-5 bg-[#111424] border border-slate-800/80 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--orange)_55%,transparent)] hover:backdrop-blur-md " +
        (highlight || variant ? "ai-halo" : "")
      }
    >
      {highlight && !variant && <span aria-hidden className="ai-halo-bg" />}
      {variant && (
        <>
          <span
            aria-hidden
            className="ai-halo-bg opacity-30 transition-opacity duration-500 group-hover:opacity-70"
          />
          <span
            aria-hidden
            className="qp-sheen opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          >
            <span className="qp-sheen-bar" style={{ ["--qp-delay" as string]: `${delay}s` }} />
          </span>
          <QuickPropDecor variant={variant} />
        </>
      )}
      <div className="relative z-10">
        <div
          className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-glow ${variant ? "pr-10" : ""}`}
        >
          <span
            className={`grid size-7 place-items-center rounded-lg border border-orange/30 bg-orange/10 text-orange-glow ${variant ? "qp-pulse transition-transform duration-500 group-hover:scale-105 group-hover:rotate-[-4deg]" : ""}`}
          >
            <Icon className="size-3.5" />
          </span>
          {eyebrow}
          {info && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${eyebrow} — more info`}
                  className="ml-auto shrink-0 text-white/45 hover:text-orange-glow"
                >
                  <Info className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-xs leading-5">{info}</PopoverContent>
            </Popover>
          )}
        </div>
        <h3 className="mt-3 font-display text-lg font-bold leading-tight tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-[12px] text-white/65">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-1.5">
                <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-orange-glow" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-3">
          <div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-orange-glow">
              {stat}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {statLabel}
            </div>
          </div>
          <ArrowRight className="size-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-orange-glow" />
        </div>
      </div>
    </article>
  );
}

function BenefitRow({
  icon: Icon,
  title,
  body,
  delay = 0,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--orange)_55%,transparent)] hover:backdrop-blur-md dark:border-slate-800/80 dark:bg-[#111424]">
      <span
        aria-hidden
        className="ai-halo-bg opacity-30 transition-opacity duration-500 group-hover:opacity-65"
      />
      <span
        aria-hidden
        className="qp-sheen opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <span className="qp-sheen-bar" style={{ ["--qp-delay" as string]: `${delay}s` }} />
      </span>
      <div className="relative z-10 flex items-start gap-3">
        <span className="qp-pulse grid size-9 shrink-0 place-items-center rounded-lg border border-orange/30 bg-orange/10 text-orange-glow transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </div>
          <div className="mt-1 text-[12px] leading-5 text-slate-700 dark:text-amber-100/80">
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValueCards() {
  return (
    <>
      <section>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Sparkles className="size-3.5" /> What you get
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
            Three reasons builders pick <span className="text-orange-glow">HANDWERK</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            The essentials, up front — what every project gets the moment you post.
          </p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <QuickProp
            icon={Zap}
            title="Same-day matching"
            body="Median first quote in under 4 hours."
            variant="spark"
            delay={0}
          />
          <QuickProp
            icon={BadgeCheck}
            title="Compliance Engine Gate"
            body="Verification is designed to prioritize compliance. Pros are prompted to provide valid commercial credentials during our multi-step platform onboarding process."
            info={COVERED_INFO}
            variant="shield"
            delay={0.6}
          />
          <QuickProp
            icon={Mic}
            title="Voice-first briefs"
            body="Describe it — AI helps structure it."
            variant="voice"
            delay={1.2}
          />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Sparkles className="size-3.5" /> Why HANDWERK
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Built for builders.
            <br className="hidden sm:block" />
            <span className="text-orange-glow"> Tuned for speed.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Every detail — from how briefs are written, to how trades are matched, to how you stay
            in control — is designed to remove the friction the old portals never fixed.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ValueCard
            icon={Zap}
            eyebrow="Same-day matching"
            title="Quotes within hours, not weeks"
            body="Your brief fans out to the right trades in your radius the moment you post."
            bullets={[
              "Median first quote in under 4 hours",
              "Auto-matched by trade, skill & radius",
              "Filter by city across all of BW",
            ]}
            stat="< 4h"
            statLabel="median first quote"
            highlight
            variant="spark"
            delay={0}
          />
          <ValueCard
            icon={BadgeCheck}
            eyebrow="Compliance Engine Gate"
            title="Trades self-declare. You stay in control."
            body="Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring."
            bullets={[
              "Insurance & tax ID self-declared at signup",
              "Public profile, references, ratings visible",
              "Verify licenses & insurance directly before signing",
            ]}
            stat="BW REGIONAL"
            statLabel="active discovery radius"
            info={COVERED_INFO}
            highlight
            variant="shield"
            delay={0.6}
          />
          <ValueCard
            icon={Mic}
            eyebrow="Voice-first briefs"
            title="Describe it. We help structure it."
            body="Tap the mic, describe the job in your own words — AI helps shape it into a clean brief you can edit before posting."
            bullets={[
              "Voice → structured brief in ~60 seconds",
              "Edit scope, budget & timeline before posting",
              "Same flow works in DE and EN",
            ]}
            stat="60s"
            statLabel="to a live brief"
            highlight
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BenefitRow
            icon={MapPin}
            title="Local-first"
            body="Trades from your city and radius — not the whole country."
            delay={0}
          />
          <BenefitRow
            icon={Clock}
            title="No phone-tag"
            body="Clarifying questions land in one thread, not five voicemails."
            delay={0.4}
          />
          <BenefitRow
            icon={Wallet}
            title="Free to post"
            body="Post a project at no cost. You only pay your trade when work is agreed."
            delay={0.8}
          />
          <BenefitRow
            icon={MessageSquare}
            title="DE & EN"
            body="Run the whole flow in German or English — your trade can reply in either."
            delay={1.2}
          />
        </div>
      </section>
    </>
  );
}
