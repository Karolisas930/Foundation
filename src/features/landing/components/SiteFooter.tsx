import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Github,
  Linkedin,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Twitter,
} from "lucide-react";
import { TrustBadge } from "./shared";

type FooterLink = {
  label: string;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  soon?: boolean;
};

function FooterCol({ title, links }: { title: string; links: Array<FooterLink> }) {
  return (
    <div>
      <div className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-orange-glow">
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            {l.soon ? (
              <span
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center gap-2 text-white/35"
              >
                {l.label}
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45">
                  Soon
                </span>
              </span>
            ) : (
              <Link
                to={l.to!}
                params={l.params as never}
                search={l.search as never}
                className="text-white/65 transition hover:text-orange-glow"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/65 transition hover:-translate-y-0.5 hover:border-orange/50 hover:text-orange-glow"
    >
      <Icon className="size-4" />
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 mt-8 border-t border-white/8 bg-navy-ink/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
              <Sparkles className="size-3.5" /> Free to post projects · always
            </div>
            <p className="mt-3 max-w-md text-sm text-white/55">
              No subscriptions for homeowners. Trades pay only when they win.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TrustBadge icon={Lock} label="GDPR · EU-hosted" />
            <TrustBadge icon={ShieldCheck} label="Escrow-ready" />
            <TrustBadge
              icon={BadgeCheck}
              label="Verified Trade Gate"
              info="Trades self-declare their credentials during onboarding. We don't perform official chamber checks—always verify licenses and insurance directly before hiring."
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="font-display text-xl font-bold tracking-tight">
              HANDWERK<span className="text-orange">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/55">
              The construction-grade marketplace for Baden-Württemberg. Local trades, voice-first
              briefs, escrow on every milestone.
            </p>
            <div className="mt-4 flex gap-2">
              <FooterIcon href="mailto:hello@handwerk.app" icon={Mail} label="Email" />
              <FooterIcon href="https://twitter.com" icon={Twitter} label="Twitter" />
              <FooterIcon href="https://linkedin.com" icon={Linkedin} label="LinkedIn" />
              <FooterIcon href="https://github.com" icon={Github} label="GitHub" />
            </div>
          </div>

          <FooterCol
            title="Homeowners"
            links={[
              {
                label: "Post a project",
                to: "/onboarding/profile",
                search: { sector: "homeowner" },
              },
              { label: "How it works", to: "/" },
              { label: "Pricing", to: "/" },
              { label: "Dashboard", to: "/homeowner" },
            ]}
          />
          <FooterCol
            title="Trades & Ecosystem"
            links={[
              {
                label: "Join as Trade Professional",
                to: "/onboarding/profile",
                search: { sector: "handyman" },
              },
              {
                label: "Join as architect",
                to: "/onboarding/profile",
                search: { sector: "architect" },
              },
              {
                label: "Join as business",
                to: "/onboarding/profile",
                search: { sector: "business" },
              },
              { label: "Site Security", soon: true },
              { label: "Logistics", soon: true },
              { label: "Heavy Machinery", soon: true },
              { label: "Disposal & Recycling", soon: true },
              { label: "Local Building Control", soon: true },
              { label: "Sign in", to: "/login" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", to: "/about" },
              { label: "Trust & safety", to: "/trust-safety" },
              { label: "Impressum", to: "/impressum" },
              { label: "Privacy Policy", to: "/datenschutz" },
              { label: "Terms of Service", to: "/terms-of-service" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-5 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} HANDWERK GmbH · Mannheim, Baden-Württemberg</span>
          <span className="inline-flex items-center gap-2">
            <span className="live-dot" /> All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
