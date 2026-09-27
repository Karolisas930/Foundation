/**
 * HandymanProfilePage — Complete professional upgrade
 * Practical tools for tradespeople + strong public profile for winning jobs.
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, FileText } from "lucide-react";

import { ProfileHeader } from "@/features/shared/profile/components/ProfileHeader";
import { OverviewPanel } from "@/features/shared/profile/components/OverviewPanel";
import { EditProfilePanel } from "@/features/contractor/profile/components/EditProfilePanel";
import { ShowcasePortfolio } from "@/features/contractor/onboarding/components/ShowcasePortfolio";

import { PerformancePanel } from "@/features/contractor/profile/components/PerformancePanel";
import FinanzMatrix from "@/features/contractor/profile/components/FinanzMatrix";
import { SettingsPanel } from "@/features/shared/profile/components/SettingsPanel";
import { AlertsPanel } from "@/features/contractor/profile/components/AlertsPanel";

import {
  getActiveHandymanProfile,
  updateActiveHandymanProfile,
} from "@/features/contractor/profile/profile-gate";
import type { HandymanProfile } from "@/features/contractor/profile/profile-gate";
import { clearDemoUser } from "@/lib/demo-auth";
import { supabase } from "@/integrations/supabase/client";
import { getTradeSpecialtyBySlug, type TradeSpecialtyDef } from "@/api/db/schema";

import {
  AVAILABLE_LANGUAGES,
  readFile,
  type ShowcaseFolder,
} from "@/features/contractor/onboarding/components/profile-types";

type ProfileState = {
  firstName: string;
  lastName: string;
  businessName: string;
  trade: string;
  trades: string[];
  radiusKm: number;
  minProjectSize: number;
  bio: string;
  city: string;
  phone: string;
  email: string;
  publicListing: boolean;
  avatar: string | null;
  cover: string | null;
  languages: string[];
  showcase: (string | null)[];
  joinedDate: string;
  rating: number;
  jobsCompleted: number;
};

function buildProfileState(p: HandymanProfile | null): ProfileState {
  const source = (p ?? {}) as HandymanProfile & Record<string, unknown>;
  const trades = (source.trades as string[] | undefined) ?? [];
  const createdAt = (source as { createdAt?: string }).createdAt;
  const joined = createdAt ? createdAt.slice(0, 7) : "";
  const cityLine = [source.city, (source as { state?: string }).state].filter(Boolean).join(", ");
  return {
    firstName: (source.firstName as string) ?? "",
    lastName: (source.lastName as string) ?? "",
    businessName: (source as { businessName?: string }).businessName ?? "",
    trade: trades[0] ?? "",
    trades,
    radiusKm: (source.radiusKm as number) ?? 25,
    minProjectSize: Number((source as { minProjectSize?: number }).minProjectSize ?? 500),
    bio: (source as { bio?: string }).bio ?? "",
    city: cityLine,
    phone: ((source as { mobilePhone?: string }).mobilePhone as string) ?? "",
    email: ((source as { businessEmail?: string }).businessEmail as string) ?? "",
    publicListing: true,
    avatar: ((source as { avatarDataUrl?: string }).avatarDataUrl as string | null) ?? null,
    cover: null,
    languages: (source.languages as string[] | undefined) ?? [],
    showcase: [null, null, null, null],
    joinedDate: joined,
    rating: 0,
    jobsCompleted: 0,
  };
}

function pickLocalOnly(prev: ProfileState): Partial<ProfileState> {
  // Preserve values the ledger doesn't track (cover image, showcase edits in-page).
  return { cover: prev.cover, showcase: prev.showcase };
}

export type FullPageTab =
  | "overview"
  | "edit"
  | "portfolio"
  | "performance"
  | "finanz"
  | "settings"
  | "messages"
  | "notifications";

export function HandymanProfilePage({
  initialPage = "overview",
  initialSpecialtySlug,
}: { initialPage?: FullPageTab; initialSpecialtySlug?: string } = {}) {
  const activeSpecialty: TradeSpecialtyDef | undefined = initialSpecialtySlug
    ? getTradeSpecialtyBySlug(initialSpecialtySlug)
    : undefined;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => buildProfileState(getActiveHandymanProfile()));

  // Refresh when the ledger updates (e.g. after onboarding submit in another tab/hook).
  useEffect(() => {
    const sync = () =>
      setProfile((prev) => ({
        ...buildProfileState(getActiveHandymanProfile()),
        ...pickLocalOnly(prev),
      }));
    window.addEventListener("chameleon_ledger_update", sync);
    return () => window.removeEventListener("chameleon_ledger_update", sync);
  }, []);

  // Hydrate the saved registration data (name, company, phone, city, trades,
  // bio, radius, minimum project size, languages) from Supabase on mount so
  // returning users always see what they entered during sign-up — even on a
  // new device or after the local draft has been cleared. Auth metadata from
  // the sign-up form is used as a second-level fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        const uid = user?.id;
        if (!uid) return;

        type ProfileRow = {
          full_name: string | null;
          display_name: string | null;
          company_name: string | null;
          phone: string | null;
          city: string | null;
          postal_code: string | null;
          bio: string | null;
          avatar_url: string | null;
          trades: string[] | null;
          service_radius_km: number | null;
          min_project_size: number | null;
          languages: string[] | null;
        };

        const { data } = await (
          supabase.from("profiles") as unknown as {
            select: (cols: string) => {
              eq: (
                col: string,
                val: string,
              ) => { maybeSingle: () => Promise<{ data: ProfileRow | null }> };
            };
          }
        )
          .select(
            "full_name, display_name, company_name, phone, city, postal_code, bio, avatar_url, trades, service_radius_km, min_project_size, languages",
          )
          .eq("id", uid)
          .maybeSingle();

        if (cancelled) return;

        const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
        const metaStr = (key: string) => {
          const v = meta[key];
          return typeof v === "string" && v.trim() ? v.trim() : "";
        };

        const remoteFullName = (data?.full_name ?? "").trim() || metaStr("full_name");
        const [remoteFirst = "", ...remoteRest] = remoteFullName.split(/\s+/).filter(Boolean);
        const remoteLast = remoteRest.join(" ");
        const remoteCompany =
          (data?.company_name ?? "").trim() ||
          (data?.display_name ?? "").trim() ||
          metaStr("display_name");
        const remotePhone = (data?.phone ?? "").trim() || metaStr("phone");
        const remoteCity = (data?.city ?? "").trim();
        const remoteBio = (data?.bio ?? "").trim();
        const remoteTrades = Array.isArray(data?.trades) ? data!.trades! : [];

        setProfile((prev) => {
          const trades = remoteTrades.length > 0 ? remoteTrades : prev.trades;
          return {
            ...prev,
            firstName: remoteFirst || prev.firstName,
            lastName: remoteLast || prev.lastName,
            businessName: remoteCompany || prev.businessName,
            phone: remotePhone || prev.phone,
            email: user?.email || prev.email || "",
            city: remoteCity || prev.city,
            bio: remoteBio || prev.bio,
            trades,
            trade: trades[0] || prev.trade || "",
            avatar: data?.avatar_url ?? prev.avatar ?? null,
            radiusKm: Number(data?.service_radius_km ?? prev.radiusKm) || prev.radiusKm,
            minProjectSize:
              Number(data?.min_project_size ?? prev.minProjectSize) || prev.minProjectSize,
            languages:
              Array.isArray(data?.languages) && data!.languages!.length > 0
                ? data!.languages!
                : prev.languages,
          };
        });
      } catch {
        /* non-fatal — local ledger values remain in place */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [editDirty, setEditDirty] = useState(false);
  const [tab, setTab] = useState<FullPageTab>(initialPage);

  const fullName = useMemo(
    () => [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    [profile.firstName, profile.lastName],
  );

  const updateProfile = useCallback((updates: Partial<typeof profile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    setEditDirty(true);
  }, []);

  const saveProfile = useCallback(async () => {
    updateActiveHandymanProfile(profile);
    // Persist the matching-critical preferences to Supabase so they follow
    // the account across devices. Silently no-op when signed out (demo mode).
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (uid) {
        await supabase.from("profiles").upsert(
          {
            id: uid,
            service_radius_km: profile.radiusKm,
            min_project_size: profile.minProjectSize,
            // Persist trades + languages so the server-side matching
            // engine can filter/score jobs against the contractor's
            // saved profile.
            trades: profile.trades ?? [],
            languages: profile.languages ?? [],
          } as never,
          { onConflict: "id" },
        );
      }
    } catch {
      /* non-fatal — local ledger already updated */
    }
    toast.success("Profile saved — visible to homeowners");
    setEditDirty(false);
  }, [profile]);

  const specialties = useMemo(
    () =>
      (profile.trades && profile.trades.length > 0
        ? profile.trades
        : ["Fundamente", "Mauerwerk", "Sanierung"]
      ).slice(0, 8),
    [profile.trades],
  );

  const isPublicView = tab === "overview";

  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid text-slate-50 pb-40 sm:pb-44">
      <div className="mx-auto w-full max-w-3xl">
        {tab !== "finanz" && tab !== "performance" && (
          <ProfileHeader
            fullName={fullName}
            businessName={profile.businessName}
            trade={profile.trade}
            trades={profile.trades}
            city={profile.city}
            radiusKm={profile.radiusKm}
            verified={false}
            avatar={profile.avatar}
            cover={profile.cover}
            activeLangs={AVAILABLE_LANGUAGES.filter((l) => profile.languages.includes(l.code))}
            readOnly={isPublicView}
            dirty={editDirty}
            onPickAvatar={async (file) => {
              if (file) updateProfile({ avatar: await readFile(file) });
            }}
            onPickCover={async (file) => {
              if (file) updateProfile({ cover: await readFile(file) });
            }}
            onRemoveLanguage={
              tab === "edit"
                ? (code) =>
                    updateProfile({
                      languages: profile.languages.filter((c) => c !== code),
                    })
                : undefined
            }
            onSave={saveProfile}
          />
        )}

        {/* SPECIALTY TAGS — sub-category chips beneath the trade title */}
        {isPublicView && specialties.length > 0 && (
          <div className="px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200 backdrop-blur-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pt-6 sm:px-6">
          {activeSpecialty && (
            <div className="mb-6 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/15 via-slate-900/40 to-slate-900/60 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/80">
                    Active trade tool
                  </p>
                  <h3 className="mt-1 font-display text-lg font-extrabold text-white">
                    {activeSpecialty.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Required certifications: {activeSpecialty.requiredCertifications.join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {activeSpecialty.features.permits && (
                    <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                      Permits
                    </span>
                  )}
                  {activeSpecialty.features.inspection && (
                    <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                      Inspection
                    </span>
                  )}
                  {activeSpecialty.features.subsidyPrograms && (
                    <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                      Subsidies
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {tab === "overview" && <OverviewPanel {...profile} />}
          {tab === "edit" && (
            <EditProfilePanel
              firstName={profile.firstName}
              lastName={profile.lastName}
              businessName={profile.businessName}
              trade={profile.trade}
              radiusKm={profile.radiusKm}
              minProjectSize={profile.minProjectSize}
              bio={profile.bio}
              languages={profile.languages}
              avatar={profile.avatar}
              cover={profile.cover}
              onPickAvatar={async (file) => {
                if (file) updateProfile({ avatar: await readFile(file) });
              }}
              onPickCover={async (file) => {
                if (file) updateProfile({ cover: await readFile(file) });
              }}
              dirty={editDirty}
              setFirstName={(v) => updateProfile({ firstName: v })}
              setLastName={(v) => updateProfile({ lastName: v })}
              setBusinessName={(v) => updateProfile({ businessName: v })}
              setTrade={(v) => updateProfile({ trade: v })}
              setRadiusKm={(v) => updateProfile({ radiusKm: v })}
              setMinProjectSize={(v) => updateProfile({ minProjectSize: v })}
              setBio={(v) => updateProfile({ bio: v })}
              toggleLanguage={(code) =>
                updateProfile({
                  languages: profile.languages.includes(code)
                    ? profile.languages.filter((c) => c !== code)
                    : [...profile.languages, code],
                })
              }
              onSave={saveProfile}
            />
          )}
          {tab === "portfolio" && (
            <ShowcasePortfolio
              folders={[]}
              onPickFolderImage={() => {}}
              onClearFolderImage={() => {}}
              onAddFolder={() => {}}
              onRemoveFolder={() => {}}
              onRenameFolder={() => {}}
            />
          )}

          {tab === "performance" && <PerformancePanel />}
          {tab === "finanz" && <FinanzMatrix />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "notifications" && <AlertsPanel />}
        </div>

        {/* CONTACT LOCK BANNER — public view only */}
        {isPublicView && (
          <div className="px-4 pt-6 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/15 via-slate-900/40 to-slate-900/60 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-orange-400/40 bg-orange-500/20 text-orange-200">
                  <Lock className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-extrabold text-white">
                    Anonymous lead until mutual interest
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    Leads stay anonymous while both sides review fit. The homeowner's phone, email,
                    and address are unlocked{" "}
                    <span className="font-semibold text-white">
                      only when the project is directly awarded to you
                    </span>{" "}
                    — in line with GDPR purpose limitation, client data is released for executing
                    the awarded project, not for outreach or prospecting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GERMAN LEGAL COMPLIANCE — Impressum footer */}
        {isPublicView && (
          <div className="px-4 pb-6 pt-6 sm:px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-200">
                <FileText className="size-4 text-orange" />
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wider">
                  Legal Disclosure &amp; Imprint
                </h3>
              </div>
              <dl className="grid gap-x-4 gap-y-2 text-xs text-slate-300 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Company
                  </dt>
                  <dd className="text-slate-200">{profile.businessName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Managing Director
                  </dt>
                  <dd className="text-slate-200">{fullName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Commercial Register No.
                  </dt>
                  <dd className="text-slate-200">Not provided</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    VAT ID
                  </dt>
                  <dd className="text-slate-200">Not provided</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Responsible for Content (acc. to § 55 Abs. 2 RStV)
                  </dt>
                  <dd className="text-slate-200">{fullName || "—"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Information pursuant to § 5 TMG. Dispute Resolution: The European Commission
                provides a platform for online dispute resolution (OS):{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  className="text-orange-300 underline hover:text-orange-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  ec.europa.eu/consumers/odr
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
