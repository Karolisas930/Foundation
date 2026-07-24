import { Link } from "@tanstack/react-router";
import { Mic, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CraneScene } from "./shared";

export function CtaFooterSection() {
  return (
    <section
      id="for-trades"
      className="relative scroll-mt-24 overflow-hidden rounded-3xl glass-panel glass-panel-hover p-8 shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--orange)_40%,transparent)] sm:p-14 lg:p-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px orange-aurora opacity-70"
      />
      <CraneScene className="pointer-events-none absolute -right-6 -top-6 hidden h-56 w-56 opacity-70 md:block" />
      <div className="relative z-10 grid gap-8 sm:grid-cols-[1.4fr_1fr] sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full chip-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-glow">
            <Sparkles className="size-3.5" /> Built for tradespeople
          </div>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            More jobs, less admin.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Join the HANDWERK network to get discovered by homeowners, quote faster, and keep your
            workflow organised from the first enquiry to the final invoice.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground sm:text-base">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-glow" />
              <span>Get matched with local jobs that fit your trade and location.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-glow" />
              <span>Spend less time chasing leads and more time on-site.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-glow" />
              <span>Keep quotes, invoices and client communication in one place.</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            asChild
            size="lg"
            className="btn-glow btn-glow-hover btn-glow-pulse h-12 px-6 text-sm font-semibold transition-transform hover:scale-[1.03] animate-pulse shadow-[0_0_25px_rgba(249,115,22,0.5)] border border-orange-500"
          >
            <Link to="/onboarding/profile" search={{ sector: "handyman" }}>
              <Users className="mr-1.5 size-4" /> Join as a trade
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
