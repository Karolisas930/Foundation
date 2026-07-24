import { BadgeCheck, HardHat, Lock, Quote, ShieldCheck, Star } from "lucide-react";
import { TrustBadge } from "./shared";

const COVERED_INFO =
  "Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring.";

const PARTNERS = [
  "• Region Stuttgart",
  "• Region Heidelberg",
  "• Stadt Mannheim",
  "• Baden-Württemberg",
];

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="group relative overflow-hidden rounded-2xl glass-panel glass-panel-hover p-5 bg-[#111424] border border-slate-800/80 hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50">
      <Quote className="absolute right-4 top-4 size-6 text-orange/30 transition group-hover:text-orange-glow" />
      <div className="flex gap-0.5 text-orange">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5 fill-current" />
        ))}
      </div>
      <blockquote className="mt-3 text-sm leading-6 text-foreground/80">"{quote}"</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-white/8 pt-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full border border-orange/30 bg-orange/10 font-display text-sm font-bold text-orange-glow">
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  return (
    <section>
      <div className="glass-card rounded-2xl p-5 sm:p-7">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
              <ShieldCheck className="size-3.5" /> Trust &amp; compliance
            </div>
            <h3 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
              EU-hosted. Transparent. GDPR by default.
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Data stays in Frankfurt. Trades self-declare insurance and tax ID at signup — we're
              upfront about what we verify and what we don't, so you can make informed decisions
              before contracting.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:items-end">
            <TrustBadge icon={Lock} label="GDPR · EU-hosted" />
            <TrustBadge icon={BadgeCheck} label="Compliance Engine Gate" info={COVERED_INFO} />
            <TrustBadge icon={HardHat} label="Insurance self-declared" info={COVERED_INFO} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Star className="size-3.5" /> Beta Feedback
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            Built with feedback from{" "}
            <span className="text-orange-glow">local pros & homeowners</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entwickelt mit Feedback von lokalen Profis & Eigentümern
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[11px] font-semibold text-orange-glow">
            🚀 BETA PHASE — Shaping the future of craft matching.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6">
        <Testimonial
          quote="The Voice Intake concept is a game changer. Being able to just speak a job and have it structured automatically will save hours of typing."
          name="Markus T."
          role="Beta Tester · Early Homeowner Concept"
        />
        <Testimonial
          quote="Looking forward to a clean job feed filtered purely by radius and actual trade skill. No more sorting through massive spam portals."
          name="Andreas K."
          role="Beta Tester · Master Electrician"
        />
        <Testimonial
          quote="The idea of transparent quotes and direct chat before any contract is exactly what the craft market needs. Excited to see it launch."
          name="Sarah M."
          role="Core Concept · Renovation Planner"
        />
      </div>

      <div className="mt-12 overflow-hidden marquee-mask">
        <div className="text-center text-xs text-slate-500 uppercase tracking-[0.3em]">
          Active Recruitment Regions
        </div>
        <div className="mt-4 flex marquee-track gap-12 whitespace-nowrap">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <span
              key={`${p}-${i}`}
              className="font-display text-lg font-bold tracking-tight text-muted-foreground/70 transition hover:text-orange-glow"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
