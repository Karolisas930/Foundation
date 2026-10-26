import { useEffect, useState } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { getEcosystemLedger } from "@/core/demo-session";
import { getDemoUser, subscribeDemoUser } from "@/lib/demo-auth";
import { DashboardShell } from "@/features/shared/dashboard/components/DashboardShell";
import type { SectorId } from "@/core/sector-config";
import { Hero } from "@/features/landing/components/Hero";
import { HomeCarousel, PartnerStrip } from "@/features/landing/components/HomeCarousel";
import { ValueCards } from "@/features/landing/components/ValueCards";
import { CtaFooterSection } from "@/features/landing/components/CtaFooterSection";
import { SiteFooter } from "@/features/landing/components/SiteFooter";

export function LandingPage() {
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const [ledger, setLedger] = useState(() => getEcosystemLedger());
  const [signedInSector, setSignedInSector] = useState<SectorId | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const compute = () => {
      const user = getDemoUser();
      const sector = getEcosystemLedger().session.sector;
      if (user && sector && sector !== "homeowner") {
        const mapped: SectorId =
          sector === "handyman" || sector === "business" ? (sector as SectorId) : "handyman";
        setSignedInSector(mapped);
      } else {
        setSignedInSector(null);
      }
      setHydrated(true);
    };
    compute();
    const unsubUser = subscribeDemoUser(compute);
    const onLedger = () => {
      compute();
      setLedger(getEcosystemLedger());
    };
    window.addEventListener("chameleon_ledger_update", onLedger);
    return () => {
      unsubUser();
      window.removeEventListener("chameleon_ledger_update", onLedger);
    };
  }, []);

  if (hydrated && signedInSector) {
    return <DashboardShell sector={signedInSector} />;
  }

  const liveJobs = ledger.projects.filter((p) => {
    if (p.status !== "open" && p.status !== "clarifying") return false;
    if (cityFilter) return (p.city ?? "").toLowerCase() === cityFilter.toLowerCase();
    return true;
  });
  const openCount = ledger.projects.filter((p) => p.status === "open").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground/90">
      <div aria-hidden className="absolute inset-0 blueprint-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] orange-aurora"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <TopBar showSignIn />

      <main
        id="top"
        className="relative z-10 mx-auto max-w-6xl space-y-16 px-4 pb-24 pt-16 sm:space-y-20 sm:px-5 sm:pb-28 sm:pt-20 lg:px-8 lg:pt-24"
      >
        <Hero verifiedTrades={1284} openCount={openCount} bwCoverage={5} />
        <HomeCarousel liveJobs={liveJobs} cityFilter={cityFilter} onCityChange={setCityFilter} />
        <PartnerStrip />
        <ValueCards />
        <CtaFooterSection />
      </main>

      <SiteFooter />
    </div>
  );
}
