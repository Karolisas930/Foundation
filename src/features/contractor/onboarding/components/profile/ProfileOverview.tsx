/**
 * ProfileOverview — Tab 1: identity hero, completion, quick stats.
 * Presentational only. All state lives in HandymanProfilePage.
 */
import { Camera, Check, Hammer, Repeat2, Timer, UserCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { initials } from "../profile-types";

export interface ProfileOverviewProps {
  fullName: string;
  businessName: string;
  trade: string;
  city: string;
  avatar: string | null;
  bio: string;
  activeLangFlags: string;
  radiusKm: number;
  completionSteps: { label: string; done: boolean }[];
  onPickAvatar: (file?: File | null) => void;
  onEdit: () => void;
}

export function ProfileOverview(p: ProfileOverviewProps) {
  const completedCount = p.completionSteps.filter((s) => s.done).length;
  const pct = Math.round((completedCount / p.completionSteps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-3xl border border-orange/15 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-orange/5 p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <label
            htmlFor="overviewAvatar"
            className="group relative cursor-pointer"
            title="Change avatar"
          >
            <div className="relative grid size-28 place-items-center overflow-hidden rounded-full border-2 border-orange/40 bg-[#0f172a] ring-4 ring-orange/10 sm:size-32">
              {p.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar} alt={p.fullName} className="size-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-extrabold text-orange">
                  {initials(p.fullName)}
                </span>
              )}
              <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </span>
            </div>
            <input
              id="overviewAvatar"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => p.onPickAvatar(e.target.files?.[0])}
            />
          </label>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
              {p.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {p.businessName || "Add your business name"}
            </p>
            {p.trade ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-orange">
                <Hammer className="size-3.5" /> {p.trade}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={p.onEdit}
            className="btn-glow btn-glow-hover h-10 shrink-0 rounded-full px-5 text-xs"
          >
            Edit profile
          </Button>
        </div>
      </section>

      {/* Completion */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profile completion
          </p>
          <p className="text-sm font-bold text-white">
            {completedCount}/{p.completionSteps.length}{" "}
            <span className="text-orange">· {pct}%</span>
          </p>
        </div>
        <Progress
          value={pct}
          className="mt-3 h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-orange [&>div]:to-amber-400"
        />
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {p.completionSteps.map((s) => (
            <li
              key={s.label}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                s.done
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {s.done ? <Check className="size-3" /> : null}
              {s.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Timer className="size-4" />}
          tone="sky"
          label="Response"
          value="< 2h"
          hint="Average first reply"
        />
        <StatCard
          icon={<Repeat2 className="size-4" />}
          tone="emerald"
          label="Repeat clients"
          value="32%"
          hint="Of last 50 jobs"
        />
      </section>

      {/* At-a-glance summary */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-orange/15 text-orange">
            <UserCircle2 className="size-5" />
          </span>
          <h2 className="font-display text-lg font-bold text-white">At a glance</h2>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Business", value: p.businessName || "—" },
            { label: "Primary trade", value: p.trade || "—" },
            { label: "Service radius", value: `${p.radiusKm} km` },
            // Languages intentionally hidden from the public profile.
            // They are used only for job matching and are edited in Profile Settings.
            { label: "City", value: p.city || "—" },
            {
              label: "Bio",
              value: p.bio ? `${p.bio.slice(0, 60)}${p.bio.length > 60 ? "…" : ""}` : "—",
            },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white truncate">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: "sky" | "emerald" | "orange";
  label: string;
  value: string;
  hint: string;
}) {
  const tones: Record<string, string> = {
    sky: "bg-sky-400/15 text-sky-300",
    emerald: "bg-emerald-400/15 text-emerald-300",
    orange: "bg-orange/15 text-orange",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2">
        <span className={`grid size-8 place-items-center rounded-full ${tones[tone]}`}>{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}
