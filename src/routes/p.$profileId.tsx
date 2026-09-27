// @ts-nocheck
/**
 * Public profile route: /p/:profileId
 *
 * SSR-safe: the loader only calls the anon-safe `getPublicProfile` server fn
 * (no bearer needed). Contact fields — website, Instagram, business phone —
 * are fetched CLIENT-SIDE via `getProfileForViewer` (requires auth), and are
 * returned by the server only when an unlocked match exists between the
 * signed-in viewer and the profile owner.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Compass, Lock, Building2, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { OverviewPanel } from "@/features/shared/profile/components/OverviewPanel";
import { ReportProfileDialog } from "@/features/homeowner/profile/components/ReportProfileDialog";
import { ContactBlock } from "@/features/homeowner/profile/components/ContactBlock";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveHandymanProfile,
  type HandymanProfile,
} from "@/features/contractor/profile/profile-gate";
import {
  getPublicProfile,
  getProfileForViewer,
  requestMatch,
  acceptMatch,
  type PublicProfile,
} from "@/lib/privacy-gate.functions";

export const Route = createFileRoute("/p/$profileId")({
  head: ({ loaderData }) => {
    const p = (loaderData as { profile: PublicProfile | null } | undefined)?.profile;
    return {
      meta: [
        { title: `${p?.business_name ?? "Handwerker"} — HANDWERK` },
        {
          name: "description",
          content: p?.bio?.slice(0, 155) ?? "Verifiziertes Handwerker-Profil auf HANDWERK.",
        },
      ],
    };
  },
  loader: async ({ params }): Promise<{ profile: PublicProfile | null }> => {
    const profile = await getPublicProfile({ data: { profileId: params.profileId } });
    return { profile };
  },
  errorComponent: ({ error }) => (
    <FrameShell>
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-200">Profil konnte nicht geladen werden.</p>
        <p className="mt-2 text-xs text-red-200/70">{error.message}</p>
      </div>
    </FrameShell>
  ),
  notFoundComponent: () => (
    <FrameShell>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
        Dieses Profil existiert nicht.
      </div>
    </FrameShell>
  ),
  component: PublicProfilePage,
});

function FrameShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-50">
      <TopBar />
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">{children}</div>
      <BottomBar />
    </div>
  );
}

function PublicProfilePage() {
  const loaderData = Route.useLoaderData() as { profile: PublicProfile | null } | undefined;
  const profile = loaderData?.profile ?? null;
  const { profileId } = Route.useParams();

  // Detect signed-in state client-side (SSR-safe).
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(Boolean(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Auth guard: unauthenticated visitors are redirected to /auth with a
  // `next` param so they return to this profile after signing in.
  useEffect(() => {
    if (signedIn === false && typeof window !== "undefined") {
      const next = `/p/${profileId}`;
      window.location.replace(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [signedIn, profileId]);

  const fetchViewer = useServerFn(getProfileForViewer);
  const viewerQuery = useQuery({
    queryKey: ["profile-for-viewer", profileId, signedIn],
    queryFn: () => fetchViewer({ data: { profileId } }),
    enabled: signedIn === true,
    staleTime: 15_000,
  });

  const runRequestMatch = useServerFn(requestMatch);
  const runAcceptMatch = useServerFn(acceptMatch);
  const [busy, setBusy] = useState(false);

  const onRequestOrAccept = async () => {
    setBusy(true);
    try {
      let matchId = viewerQuery.data?.matchId ?? null;
      if (!matchId) {
        const created = await runRequestMatch({ data: { contractorId: profileId } });
        matchId = created.id;
      }
      const updated = await runAcceptMatch({ data: { matchId } });
      await viewerQuery.refetch();
      if (updated.status === "unlocked") {
        toast.success("Match freigeschaltet — Kontaktdaten sind jetzt sichtbar.");
      } else {
        toast.success("Angebot angenommen — warten auf die Gegenseite.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Aktion fehlgeschlagen.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const remote = viewerQuery.data?.profile ?? profile;

  // Overlay real registration data from the local onboarding ledger (client-only).
  // The demo app stores the trade professional's full registration (business
  // name, trades[], city, radius, bio) in the ledger; Supabase only holds a
  // subset. Prefer ledger values when present so the public profile shows the
  // actual data the user just entered — never the seeded/stale row.
  const [ledger, setLedger] = useState<HandymanProfile | null>(null);
  useEffect(() => {
    const sync = () => setLedger(getActiveHandymanProfile());
    sync();
    window.addEventListener("chameleon_ledger_update", sync);
    return () => window.removeEventListener("chameleon_ledger_update", sync);
  }, []);

  const display = useMemo(() => {
    if (!remote && !ledger) return null;
    const businessName =
      (ledger as unknown as { businessName?: string })?.businessName ||
      remote?.business_name ||
      null;
    const trades = ledger?.trades && ledger.trades.length > 0 ? ledger.trades : [];
    const trade = trades[0] ?? remote?.trade ?? null;
    const city = ledger?.city ?? remote?.city ?? null;
    const bio =
      ((ledger as unknown as { bio?: string })?.bio as string | undefined) || remote?.bio || null;
    const radiusKm = ledger?.radiusKm ?? 25;
    return {
      id: remote?.id ?? profileId,
      business_name: businessName,
      trade,
      trades,
      city,
      bio,
      radiusKm,
      created_at: remote?.created_at ?? "",
    };
  }, [remote, ledger, profileId]);

  const unlocked = viewerQuery.data?.unlocked ?? false;
  const isOwner = viewerQuery.data?.isOwner ?? false;
  const matchStatus = viewerQuery.data?.matchStatus ?? null;

  // Show a lock screen while the auth guard's redirect is in flight so we
  // don't flash profile content to logged-out visitors.
  if (signedIn === false) {
    return (
      <FrameShell>
        <div className="rounded-2xl border border-orange-300/20 bg-gradient-to-br from-orange-500/[0.08] via-white/[0.02] to-transparent p-8 text-center">
          <Lock className="mx-auto size-8 text-orange-200" strokeWidth={1.75} />
          <h1 className="mt-3 font-display text-xl font-bold text-white">Anmeldung erforderlich</h1>
          <p className="mt-2 text-sm text-slate-300/85">Du wirst zur Anmeldung weitergeleitet …</p>
          <Link
            to="/login"
            search={{ next: `/p/${profileId}` } as never}
            className="mt-4 inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-sm font-bold text-slate-950"
          >
            Zur Anmeldung
          </Link>
        </div>
      </FrameShell>
    );
  }

  if (!display) {
    return (
      <FrameShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          Dieses Profil existiert nicht.
        </div>
      </FrameShell>
    );
  }

  const tradesLine =
    display.trades && display.trades.length > 0
      ? display.trades.join(" · ")
      : (display.trade ?? "");

  return (
    <FrameShell>
      <header className="mb-6 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-display text-2xl font-bold text-white">
            {display.business_name ?? "Unbenannter Betrieb"}
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/25"
            aria-label="Handwerkskammer verifiziert"
          >
            <ShieldCheck className="size-3.5" />
            HWK verifiziert
          </span>
          {signedIn && !isOwner && (
            <div className="ml-auto">
              <ReportProfileDialog reportedId={profileId} />
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-300/80">
          {[tradesLine, display.city].filter(Boolean).join(" · ") || "Handwerker"}
        </p>

        {/* Specialty tags — sub-category chips under the trade title */}
        {display.trades && display.trades.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {display.trades.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-orange-300/25 bg-gradient-to-br from-orange-500/[0.12] to-amber-500/[0.06] px-3 py-1 text-xs font-semibold tracking-wide text-orange-100 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {display.city && (
          <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-slate-300/80">
            <Compass className="size-3.5 text-orange-300/80" />
            <span>
              Serviert im Umkreis von{" "}
              <span className="font-semibold text-white/90">{display.radiusKm} km</span> um{" "}
              <span className="font-semibold text-white/90">{display.city}</span>
            </span>
          </p>
        )}
      </header>

      <OverviewPanel
        businessName={display.business_name ?? "—"}
        trade={display.trade ?? ""}
        trades={display.trades}
        city={display.city ?? ""}
        bio={display.bio ?? "Noch keine Beschreibung."}
        radiusKm={display.radiusKm}
        rating={0}
        jobsCompleted={0}
        joinedDate={display.created_at?.slice(0, 7) ?? ""}
      />

      {/* Contact lock banner or unlocked contact block */}
      <div className="mt-6">
        {unlocked ? (
          <ContactBlock unlocked={unlocked} contact={viewerQuery.data?.contact ?? null} />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-orange-300/20 bg-gradient-to-br from-orange-500/[0.08] via-white/[0.02] to-transparent p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-orange-400/10 blur-3xl"
            />
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-orange-300/30 bg-orange-500/15 text-orange-200 shadow-inner">
                <Lock className="size-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-bold tracking-tight text-white">
                  Kontaktdaten gesperrt
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300/90">
                  Telefon, E-Mail, Website und Social Profile werden erst freigeschaltet, sobald{" "}
                  <span className="font-semibold text-white">beide Seiten</span> das Angebot
                  annehmen und ein{" "}
                  <span className="font-semibold text-orange-200">gegenseitiges Match</span>{" "}
                  entsteht. So schützen wir Handwerker vor Kaltakquise und dich vor unverbindlichen
                  Anfragen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match action panel — only for signed-in NON-owners */}
      {signedIn && !isOwner && !unlocked && (
        <div className="mt-6 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
          <p className="text-sm text-slate-300/90">
            {matchStatus === "client_accepted"
              ? "Du hast das Angebot angenommen. Sobald der Handwerker ebenfalls annimmt, werden die Kontaktdaten freigeschaltet."
              : matchStatus === "contractor_accepted"
                ? "Der Handwerker hat dich angenommen. Bestätige das Angebot, um die Kontaktdaten freizuschalten."
                : "Nimm das Angebot beidseitig an, um Website, Social Profile und Geschäftstelefon freizuschalten."}
          </p>
          <Button
            onClick={onRequestOrAccept}
            disabled={busy || matchStatus === "client_accepted"}
            className="mt-4"
          >
            {matchStatus === "client_accepted"
              ? "Warten auf Handwerker …"
              : busy
                ? "Wird verarbeitet …"
                : "Angebot annehmen & Kontakt freischalten"}
          </Button>
        </div>
      )}

      {signedIn === false && (
        <div className="mt-6 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6 text-sm text-slate-300/90">
          <a href="/login" className="font-semibold text-orange-300 hover:underline">
            Melde dich an
          </a>{" "}
          , um ein Match zu starten und die Kontaktdaten freizuschalten.
        </div>
      )}

      {/* German legal compliance — Impressum */}
      <section
        aria-labelledby="impressum-heading"
        className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300">
            <Building2 className="size-4" strokeWidth={1.75} />
          </div>
          <h2
            id="impressum-heading"
            className="font-display text-sm font-bold uppercase tracking-[0.16em] text-slate-200"
          >
            Rechtliche Angaben & Impressum
          </h2>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
              Handelsregister-Nr.
            </dt>
            <dd className="mt-0.5 font-mono text-slate-200/90">Not provided</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
              USt-IdNr.
            </dt>
            <dd className="mt-0.5 font-mono text-slate-200/90">Not provided</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
              Geschäftsführung
            </dt>
            <dd className="mt-0.5 text-slate-200/90">—</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
              Aufsichtsbehörde
            </dt>
            <dd className="mt-0.5 text-slate-200/90">Handwerkskammer —</dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-400/70">
          Angaben gemäß § 5 TMG. Alle Platzhalter werden durch die vom Betrieb hinterlegten
          offiziellen Registerdaten ersetzt.
        </p>
      </section>

      {/* Floating primary action — deep-link into the project posting wizard */}
      {!isOwner && (
        <Link
          to="/onboarding/profile"
          search={{ sector: "homeowner", contractorId: profileId } as never}
          className="fixed bottom-24 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-orange-300/30 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-bold tracking-wide text-slate-950 shadow-[0_10px_30px_-8px_rgba(249,115,22,0.55)] transition hover:from-orange-400 hover:to-amber-400 hover:shadow-[0_14px_36px_-8px_rgba(249,115,22,0.7)] active:scale-[0.98] sm:bottom-8"
          aria-label="Projekt anfragen"
        >
          <Send className="size-4" strokeWidth={2.25} />
          Projekt anfragen
        </Link>
      )}
    </FrameShell>
  );
}
