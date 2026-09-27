/**
 * ContractorDashboard — Home for signed-in Handwerker.
 *
 * Composes metric cards, big Voice-to-Invoice CTA, quick actions,
 * mini Job Radar, and recent invoice activity. Presentation pieces
 * live in ./components/*.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  ScanLine,
  Route as RouteIcon,
  Euro,
  FileWarning,
  Hammer,
  Gauge,
  ArrowUpRight,
  Handshake,
} from "lucide-react";

import { VoiceToInvoiceSheet } from "@/features/contractor/profile/components/toolbelt/ToolbeltModals";
import { PostHelpRequestSheet } from "@/features/contractor/onboarding/components/PostHelpRequestSheet";
import { SiteDiarySheet } from "@/features/contractor/team/components/SiteDiarySheet";

import { useLeadFeed } from "@/features/contractor/leads/use-lead-feed";
import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";
import { useAllInvoices } from "@/features/contractor/profile/components/toolbelt/invoice-store";

import { eur } from "./helpers";
import { MetricCard } from "./MetricCard";
import { BigVoiceCTA } from "./BigVoiceCTA";
import { QuickAction } from "./QuickAction";
import { MiniRadar } from "./MiniRadar";
import { RecentActivity } from "./RecentActivity";

export function ContractorDashboard() {
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const profile = getActiveHandymanProfile();
  const invoices = useAllInvoices();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const revenueMonth = invoices
    .filter((i) => i.status === "paid" && (i.paidAt ?? i.createdAt) >= monthStart)
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const outstandingCount = invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue",
  ).length;

  const { feed } = useLeadFeed();
  const activeJobs = 0;
  const openJobs = feed.priority.length;

  const kmLogged = (profile as unknown as { kmMonth?: number } | null)?.kmMonth ?? 0;

  const firstName = profile?.firstName?.trim() || "Handwerker";
  const hour = now.getHours();
  const greet =
    hour < 5
      ? "Late shift"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      {/* Header */}
      <header className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange">
            Dashboard
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {greet}, {firstName}
          </h1>
          <p className="mt-1 text-xs text-white/55">
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link
          to="/contractor/profile"
          className="hidden shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:border-orange/40 hover:text-orange sm:inline-flex"
        >
          My profile
        </Link>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Revenue · month"
          value={eur(revenueMonth)}
          hint={revenueMonth > 0 ? "Paid invoices, this month" : "No paid invoices yet"}
          Icon={Euro}
          tint="emerald"
        />
        <MetricCard
          label="Outstanding"
          value={eur(outstanding)}
          hint={outstandingCount > 0 ? `${outstandingCount} awaiting payment` : "Nothing overdue"}
          Icon={FileWarning}
          tint="orange"
        />
        <MetricCard
          label="Active jobs"
          value={String(activeJobs)}
          hint={`${openJobs} matching open jobs`}
          Icon={Hammer}
          tint="sky"
        />
        <MetricCard
          label="KM logged"
          value={`${kmLogged} km`}
          hint="This month"
          Icon={Gauge}
          tint="violet"
        />
      </section>

      {/* Site Diary — flagship on-site workflow */}
      <section className="mt-6">
        <button
          type="button"
          onClick={() => setDiaryOpen(true)}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-orange/40 bg-gradient-to-br from-orange/25 via-orange/10 to-transparent p-5 text-left transition hover:from-orange/35"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange/30 blur-2xl animate-dash-pulse"
          />
          <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange text-black shadow-lg shadow-orange/30">
            <ClipboardList className="h-7 w-7" />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange/90">
              On-site workflow
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold text-white">
              Site Diary &amp; Job Tools
            </p>
            <p className="mt-0.5 truncate text-[12px] text-white/65">
              Before/after photos · voice notes · receipts · customer sign-off — all linked to the
              job.
            </p>
          </div>
          <ArrowUpRight className="relative h-5 w-5 text-white/80 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BigVoiceCTA onClick={() => setVoiceOpen(true)} />
          <QuickAction
            to="/finanz"
            search={{ tab: "receipts", scan: "1" }}
            label="Scan Receipt"
            Icon={ScanLine}
          />
          <QuickAction to="/finanz" search={{ tab: "trips" }} label="Log Trip" Icon={RouteIcon} />
          <QuickAction onClick={() => setDiaryOpen(true)} label="Site Diary" Icon={ClipboardList} />
          <QuickAction
            onClick={() => setHelpOpen(true)}
            label="Post Help Request"
            Icon={Handshake}
          />
        </div>
      </section>

      {/* Radar + Activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MiniRadar />
        <RecentActivity />
      </div>

      <SiteDiarySheet open={diaryOpen} onOpenChange={setDiaryOpen} />
      <PostHelpRequestSheet open={helpOpen} onOpenChange={setHelpOpen} />
      <VoiceToInvoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} />
    </div>
  );
}
