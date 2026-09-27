import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getLandingData } from "@/lib/landing-stats.functions";
import { TopBar } from "@/components/shared/TopBar";
import { getEcosystemLedger } from "@/core/demo-session";
import { getDemoUser, subscribeDemoUser } from "@/lib/demo-auth";
import { DashboardShell } from "@/features/shared/dashboard/components/DashboardShell";
import type { SectorId } from "@/core/sector-config";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { resolveDashboardPath } from "@/lib/account-role";
import { Hero } from "@/features/landing/components/Hero";
import { HomeCarousel, PartnerStrip } from "@/features/landing/components/HomeCarousel";
import { ValueCards } from "@/features/landing/components/ValueCards";
import { CtaFooterSection } from "@/features/landing/components/CtaFooterSection";
import { SiteFooter } from "@/features/landing/components/SiteFooter";

export function LandingPage() {
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const fetchLanding = useServerFn(getLandingData);
  const { data } = useQuery({
    queryKey: ["landing-data"],
    queryFn: () => fetchLanding(),
    staleTime: 30_000,
  });
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
    };
    window.addEventListener("chameleon_ledger_update", onLedger);
    return () => {
      unsubUser();
      window.removeEventListener("chameleon_ledger_update", onLedger);
    };
  }, []);

  // A real (non-demo) signed-in account never belongs on the guest
  // landing page — send them straight to their own dashboard.
  const navigate = useNavigate();
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    const route = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled || !session?.user) return;
        const path = await resolveDashboardPath();
        if (!cancelled) void navigate({ to: path, replace: true });
      } catch {
        /* stay on the landing page */
      }
    };

    void route();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void route();
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, [navigate]);

  if (hydrated && signedInSector) {
    return <DashboardShell sector={signedInSector} />;
  }

  const allJobs = data?.jobs ?? [];
  const liveJobs = cityFilter
    ? allJobs.filter((p) => (p.city ?? "").toLowerCase() === cityFilter.toLowerCase())
    : allJobs;

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
        <Hero
          verifiedTrades={data?.proCount ?? 0}
          openCount={data?.openCount ?? 0}
          bwCoverage={data?.cityCount ?? 0}
        />
        <HomeCarousel liveJobs={liveJobs} pros={data?.pros ?? []} cityFilter={cityFilter} onCityChange={setCityFilter} />
        <PartnerStrip />
        <ValueCards />
        <CtaFooterSection />
      </main>

      <SiteFooter />
    </div>
  );
}
