/**
 * EditProfilePanel — the ONE place a user edits their profile.
 *
 * Scope (business legal documents intentionally excluded — no Tax ID,
 * Bank Details, Meisterbrief, Handwerkskarte here):
 *   • Profile Photo & Banner
 *   • Full Name (First + Last)
 *   • Business / Company Name
 *   • Professional Title
 *   • Business Phone Number
 *   • Public Contact Email
 *   • Service Area (City + Radius)
 *   • Address
 *   • Language
 *   • Short Bio / Description (optional)
 *
 * Visual language: dark navy, glass cards, orange accents — matches the
 * rest of the profile pages.
 */
import { useRef, useState } from "react";
import { ProfileInfoBox } from "@/features/shared/profile/components/ProfileInfoBox";
import { RadiusSlider } from "./RadiusSlider";
import { BioSection } from "@/features/shared/profile/components/BioSection";
import { LanguagesSelector } from "@/features/shared/profile/components/LanguagesSelector";
import { SaveButton } from "@/features/shared/profile/components/SaveButton";
import {
  Camera,
  ImagePlus,
  Sparkles,
  User,
  Building2,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
  Home,
  Languages as LanguagesIcon,
  FileText,
} from "lucide-react";

export interface EditProfilePanelProps {
  firstName: string;
  lastName: string;
  businessName: string;
  trade: string;
  radiusKm: number;
  minProjectSize: number;
  bio: string;
  languages: string[];
  avatar: string | null;
  cover: string | null;
  dirty: boolean;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
  setTrade: (v: string) => void;
  setRadiusKm: (v: number) => void;
  setMinProjectSize: (v: number) => void;
  setBio: (v: string) => void;
  toggleLanguage: (code: string) => void;
  onPickAvatar: (file?: File | null) => void;
  onPickCover: (file?: File | null) => void;
  onSave: () => void;
  onPrefillDemo?: () => void;
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25] blueprint-grid mix-blend-screen"
        aria-hidden
      />
      <div className="relative space-y-4">
        <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          <Icon className="size-4 text-orange" />
          {title}
        </h4>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}

export function EditProfilePanel(p: EditProfilePanelProps) {
  // Fields that don't yet live on the profile prop shape are held locally
  // so the page stays self-contained without touching sibling components.
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");

  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-5 pb-8">
      {p.onPrefillDemo && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={p.onPrefillDemo}
            title="Reset every field to realistic demo data"
            className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-glow transition hover:bg-orange/20"
          >
            <Sparkles className="h-3.5 w-3.5" /> Prefill demo
          </button>
        </div>
      )}

      {/* Profile Photo & Banner */}
      <SectionCard icon={ImagePlus} title="Profile Photo & Banner">
        <div
          style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
          className="rounded-xl border p-3"
        >
          <div className="relative h-28 w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[linear-gradient(135deg,#0b1220_0%,#0f172a_100%)]">
            {p.cover && (
              <img
                src={p.cover}
                alt="Banner preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => bannerInput.current?.click()}
              className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.10] px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/[0.18]"
            >
              <Camera className="size-3.5" />
              {p.cover ? "Replace banner" : "Upload banner"}
            </button>
            <input
              ref={bannerInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => p.onPickCover(e.target.files?.[0])}
            />

            <div className="absolute -bottom-6 left-4">
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                className="grid size-16 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-white shadow-lg ring-4 ring-[#151F32] transition hover:bg-white/[0.15]"
                aria-label="Upload profile photo"
              >
                {p.avatar ? (
                  <img src={p.avatar} alt="Profile preview" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-5 text-white/70" />
                )}
              </button>
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => p.onPickAvatar(e.target.files?.[0])}
              />
            </div>
          </div>
          <p className="mt-8 text-[11px] font-medium text-white/40">
            Your photo and banner appear on your public profile after saving.
          </p>
        </div>
      </SectionCard>

      {/* Personal & Business */}
      <SectionCard icon={User} title="Your Name">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileInfoBox
            label="First Name"
            value={p.firstName}
            onChange={p.setFirstName}
            placeholder="First name"
          />
          <ProfileInfoBox
            label="Last Name"
            value={p.lastName}
            onChange={p.setLastName}
            placeholder="Last name"
          />
        </div>
      </SectionCard>

      <SectionCard icon={Building2} title="Business">
        <ProfileInfoBox
          label="Business / Company Name"
          value={p.businessName}
          onChange={p.setBusinessName}
          placeholder="e.g. Müller Elektrotechnik GmbH"
        />
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
            Professional Title
          </label>
          <div className="relative">
            <BadgeCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-orange/80" />
            <input
              type="text"
              value={title || p.trade}
              onChange={(e) => {
                setTitle(e.target.value);
                p.setTrade(e.target.value);
              }}
              placeholder="e.g. Master Electrician"
              style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
              className="block w-full rounded-xl border py-3 pl-9 pr-4 text-base font-medium text-white placeholder:text-white/40 outline-none transition focus:border-orange/60 focus:ring-2 focus:ring-orange/30"
            />
          </div>
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard icon={Phone} title="Contact">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
            Business Phone Number
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-orange/80" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 30 12345678"
              style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
              className="block w-full rounded-xl border py-3 pl-9 pr-4 text-base font-medium text-white placeholder:text-white/40 outline-none transition focus:border-orange/60 focus:ring-2 focus:ring-orange/30"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
            Public Contact Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-orange/80" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@yourbusiness.de"
              style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
              className="block w-full rounded-xl border py-3 pl-9 pr-4 text-base font-medium text-white placeholder:text-white/40 outline-none transition focus:border-orange/60 focus:ring-2 focus:ring-orange/30"
            />
          </div>
        </div>
      </SectionCard>

      {/* Service Area & Project Preferences */}
      <SectionCard icon={MapPin} title="Service Area & Project Preferences">
        <ProfileInfoBox label="City" value={city} onChange={setCity} placeholder="e.g. Berlin" />
        <RadiusSlider value={p.radiusKm} onChange={p.setRadiusKm} />

        {/* Minimum Project Size — mirrors the registration form styling */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
              Minimum project size —{" "}
              <span className="text-orange-glow">€{p.minProjectSize.toLocaleString("de-DE")}</span>
            </label>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={100}
            value={p.minProjectSize}
            onChange={(e) => p.setMinProjectSize(Number(e.target.value))}
            className="profile-slider w-full accent-orange"
            aria-label="Minimum project size in euros"
          />
          <p className="text-[11px] text-white/40">
            Leads below this budget are routed silently to your Alerts feed.
          </p>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard icon={Home} title="Address">
        <ProfileInfoBox
          label="Street & Number"
          value={street}
          onChange={setStreet}
          placeholder="e.g. Hauptstraße 12"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileInfoBox
            label="Postal Code"
            value={postal}
            onChange={setPostal}
            placeholder="10115"
          />
          <ProfileInfoBox
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="Germany"
          />
        </div>
      </SectionCard>

      {/* Language */}
      <SectionCard icon={LanguagesIcon} title="Language">
        <LanguagesSelector selected={p.languages} onToggle={p.toggleLanguage} />
      </SectionCard>

      {/* Short Bio */}
      <SectionCard icon={FileText} title="Short Bio / Description (optional)">
        <BioSection value={p.bio} onChange={p.setBio} />
      </SectionCard>

      <SaveButton onClick={p.onSave} disabled={!p.dirty} />
    </section>
  );
}
