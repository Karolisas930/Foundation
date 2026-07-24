/**
 * Sector-panel wrappers used by the Chameleon dashboard.
 * Each panel renders the requested sector's surface as a full page.
 */
import type { SectorId } from "@/core/sector-config";
// NOTE: BuildControlPanel surface is not yet ported into this workspace —
// fall back to a lightweight placeholder so the dashboard stays reachable.

import { HomeownerDashboard } from "@/features/homeowner/dashboard/components";
import { ContractorDashboard } from "@/features/contractor/dashboard/components/ContractorDashboard";
import {
  BusinessCards,
  ArchitectCards,
  SecurityCards,
  LogisticsCards,
  DisposalCards,
} from "@/features/contractor/profile/trades";

function SectorShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="min-w-0 border-b border-slate-200 pb-6">
          <p className="truncate text-xs font-bold uppercase tracking-[0.2em] text-orange">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p>
        </header>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</section>
      </div>
    </div>
  );
}

// Default exports of the lazy chunks
export function BuildPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Build · Control center"
      title="Build control"
      subtitle="Cross-sector operations overview — full control panel coming online."
    >
      <p className="text-sm text-slate-600">
        The Build control surface hasn't been wired into this workspace yet.
      </p>
    </SectorShell>
  );
}

export function HandymanPanel(_: { sector: SectorId }) {
  return <ContractorDashboard />;
}
export function HomeownerPanel(_: { sector: SectorId }) {
  return <HomeownerDashboard />;
}
export function BusinessPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Business · Corporate"
      title="Business cockpit"
      subtitle="Crew allocation, expense capture, and onboarding for your field teams."
    >
      <BusinessCards />
    </SectorShell>
  );
}
export function ArchitectPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Architect · Planning office"
      title="Architecture & Building Control"
      subtitle="HOAI phase timeline, CAD blueprint gallery, and chamber verification."
    >
      <ArchitectCards />
    </SectorShell>
  );
}
export function SecurityPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Security · Site operations"
      title="Security operations"
      subtitle="§ 34a certified shifts, guard rosters, live CCTV monitoring."
    >
      <SecurityCards />
    </SectorShell>
  );
}
export function LogisticsPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Logistics · Fleet"
      title="Heavy haul & dispatch"
      subtitle="Güterkraftverkehr compliance, machinery fleet, on-site dispatch log."
    >
      <LogisticsCards />
    </SectorShell>
  );
}
export function DisposalPanel(_: { sector: SectorId }) {
  return (
    <SectorShell
      eyebrow="Disposal · Entsorgung"
      title="Waste & containers"
      subtitle="Environmental compliance, container fleet, electronic waste manifests."
    >
      <DisposalCards />
    </SectorShell>
  );
}
