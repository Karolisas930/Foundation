/**
 * OverviewPanel — Public-facing profile for homeowners
 * Clean, trustworthy, and designed to help trades win jobs.
 */
import {
  Star,
  Award,
  Image as ImageIcon,
  Camera,
  Lock,
  Globe,
  Instagram,
  Phone,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

interface OverviewPanelProps {
  businessName: string;
  trade: string;
  trades?: string[];
  city: string;
  bio: string;
  radiusKm: number;
  rating: number;
  jobsCompleted: number;
  joinedDate: string;
  /** Shown only when the viewer is allowed to see it (owner / accepted bid). */
  phone?: string;
  website?: string;
  instagram?: string;
  /** When provided, the account owner can tap the contact box to edit it. */
  onSaveContact?: (c: { phone: string; website: string; instagram: string }) => Promise<void> | void;
}

function ContactEditor({
  phone,
  website,
  instagram,
  onSave,
}: {
  phone: string;
  website: string;
  instagram: string;
  onSave: (c: { phone: string; website: string; instagram: string }) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ phone, website, instagram });
  const open = () => {
    setV({ phone, website, instagram });
    setEditing(true);
  };
  const rows = [
    { Icon: Globe, key: "website" as const, label: "Website", type: "url", ph: "https://yourbusiness.com" },
    { Icon: Instagram, key: "instagram" as const, label: "Instagram", type: "text", ph: "@yourhandle" },
    { Icon: Phone, key: "phone" as const, label: "Phone Number", type: "tel", ph: "+49 30 12345678" },
  ];
  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="flex w-full flex-col gap-2.5 rounded-lg text-left transition hover:bg-white/[0.03]"
        aria-label="Edit contact details"
      >
        {rows.map(({ Icon, key, label }) => {
          const val = { phone, website, instagram }[key];
          return (
            <div key={key} className={`flex items-center gap-2.5 text-sm ${val ? "text-white/90" : "text-white/35"}`}>
              <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
              <span className="min-w-0 truncate underline decoration-white/15 underline-offset-4">{val || label}</span>
              {!val && <span className="ml-auto text-[11px] text-orange-300/80">+ Add</span>}
            </div>
          );
        })}
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-300/90">
          <Pencil className="size-3" /> Tap to edit
        </span>
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(({ Icon, key, label, type, ph }) => (
        <label key={key} className="flex items-center gap-2.5 text-sm">
          <Icon className="size-3.5 shrink-0 text-white/60" strokeWidth={1.5} aria-hidden />
          <input
            type={type}
            aria-label={label}
            value={v[key]}
            placeholder={ph}
            onChange={(e) => setV((s) => ({ ...s, [key]: e.target.value }))}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-base text-white placeholder:text-white/30 outline-none focus:border-orange/60"
          />
        </label>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70"
        >
          <X className="size-3" /> Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave({ phone: v.phone.trim(), website: v.website.trim(), instagram: v.instagram.trim() });
              setEditing(false);
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-100 disabled:opacity-50"
        >
          <Check className="size-3" /> {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

type DemoReview = {
  name: string;
  date: string;
  rating: number;
  quote: string;
};

const DEMO_REVIEWS: DemoReview[] = [];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(value) ? "size-4 fill-orange/70 text-orange/70" : "size-4 text-white/20"
          }
        />
      ))}
    </div>
  );
}

export function OverviewPanel({
  businessName,
  bio,
  rating,
  jobsCompleted,
  phone,
  website,
  instagram,
  onSaveContact,
}: OverviewPanelProps) {
  const displayRating = rating > 0 ? rating : 0;
  const reviewCount = jobsCompleted;
  const onTimePct: number | null = null;

  const cardBase = "rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6";

  return (
    <div className="space-y-6 pb-8">
      {/* About + Performance — two-column balanced layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* About: 60% */}
        <div className={`${cardBase} md:col-span-3`}>
          <h3 className="font-display text-lg font-bold text-white mb-3">About {businessName}</h3>
          <p className="leading-relaxed text-slate-300/90 text-[15px]">{bio}</p>

          {/* Privacy Gate — locked contact channels */}
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 backdrop-blur-sm">
            {onSaveContact ? (
              <ContactEditor
                phone={phone ?? ""}
                website={website ?? ""}
                instagram={instagram ?? ""}
                onSave={onSaveContact}
              />
            ) : (
            <div className="flex flex-col gap-2.5">
              {[
                { Icon: Globe, label: "Website", value: website },
                { Icon: Instagram, label: "Instagram", value: instagram },
                { Icon: Phone, label: "Phone Number", value: phone },
              ].map(({ Icon, label, value }) => (
                <div key={label} className={`flex items-center gap-2.5 text-sm ${value ? "text-white/90" : "text-white/35"}`}>
                  <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
                  <span className="underline decoration-white/15 underline-offset-4">{value || label}</span>
                </div>
              ))}
            </div>
            )}
            <div className="mt-3 flex items-start gap-2 border-t border-white/[0.05] pt-3 text-[12px] text-white/55">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-white/50" strokeWidth={1.5} />
              <p className="leading-relaxed">
                🔒 Contact details will be unlocked after mutual acceptance of the offer.
              </p>
            </div>
          </div>
        </div>

        {/* Performance pills: 40% */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Star className="size-5 fill-orange/70 text-orange/70 shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {displayRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6">
            <Award className="size-5 text-orange/70 shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-xl font-bold text-white leading-tight">
                {onTimePct === null ? "—" : `${onTimePct}%`}
              </div>
              <p className="text-xs text-muted-foreground">On-time delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Before & After Gallery */}
      <section className={cardBase}>
        <h4 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="size-5 text-orange/70" /> Before & After Gallery
        </h4>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              {(["Before", "After"] as const).map((slot) => (
                <div
                  key={slot}
                  className="relative aspect-[4/3] flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-slate-900/40"
                >
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {slot}
                  </span>
                  <Camera className="size-6 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">No photos uploaded yet</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Completed project photos appear here as the pro adds them from their portfolio.
        </p>
      </section>

      {/* Verified Client Reviews */}
      <section className={cardBase}>
        <h4 className="font-display text-lg font-bold text-white mb-4">Verified Client Reviews</h4>
        {DEMO_REVIEWS.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet. Reviews appear after completed jobs.</p>
        )}
        <ul className="space-y-3">
          {DEMO_REVIEWS.map((r) => (
            <li key={r.name} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/90">“{r.quote}”</p>
              <p className="mt-2 text-xs font-semibold text-white/70">— {r.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
