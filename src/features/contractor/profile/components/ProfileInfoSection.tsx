/**
 * ProfileInfoSection — composer that splits the trade profile into
 * five focused sections (Identity, Trades & Services, Service Area,
 * Contact & Business Info, Profile Details) with a sticky progress
 * bar + smooth-scrolling anchor nav.
 *
 * Public props are unchanged so HandymanProfilePage continues to own
 * the persisted state. New fields (email, phone, website, logo,
 * team size, minimum project size, Meister badge) are held locally
 * for visual completeness — they hydrate from the ledger profile so
 * the saved values still display on next render.
 */
import { useMemo, useState } from "react";
import { Hammer, Mail, MapPin, Sparkles, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";
import {
  AVAILABLE_LANGUAGES,
  readFile,
} from "@/features/contractor/onboarding/components/profile-types";
import {
  IdentitySection,
  TradesSection,
  ServiceAreaSection,
  ContactSection,
  ProfileDetailsSection,
  ProfileProgressBar,
  type ProfileSectionMeta,
} from "@/features/contractor/onboarding/components/profile";

type Lang = (typeof AVAILABLE_LANGUAGES)[number];

interface ProfileInfoSectionProps {
  editing: boolean;
  firstName: string;
  lastName: string;
  businessName: string;
  trade: string;
  radius: number[];
  bio: string;
  languages: string[];
  activeLangLabels: Lang[];
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
  setTrade: (v: string) => void;
  setRadius: (v: number[]) => void;
  setBio: (v: string) => void;
  toggleLanguage: (code: string) => void;
  markDirty: () => void;
}

export function ProfileInfoSection({
  editing,
  firstName,
  lastName,
  businessName,
  trade,
  radius,
  bio,
  languages,
  activeLangLabels,
  setFirstName,
  setLastName,
  setBusinessName,
  setTrade,
  setRadius,
  setBio,
  toggleLanguage,
  markDirty,
}: ProfileInfoSectionProps) {
  // ── Locally-managed fields (hydrated from the active ledger profile) ──
  const seed = (getActiveHandymanProfile() ?? {}) as Record<string, unknown>;

  const [email, setEmail] = useState<string>((seed.businessEmail as string) ?? "");
  const [phone, setPhone] = useState<string>((seed.mobilePhone as string) ?? "");
  const [website, setWebsite] = useState<string>((seed.website as string) ?? "");
  const [logo, setLogo] = useState<string | null>((seed.logoDataUrl as string) ?? null);
  const [teamSize, setTeamSize] = useState<number>(Number(seed.teamSize ?? 1));
  const [minProjectSize, setMinProjectSize] = useState<number>(Number(seed.minProjectSize ?? 0));
  const [meister, setMeister] = useState<boolean>(Boolean(seed.meister ?? false));

  const onDirty = () => {
    if (editing) markDirty();
  };

  async function onPickLogo(file?: File | null) {
    if (!file) return;
    try {
      setLogo(await readFile(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load logo.");
    }
  }

  const sections: ProfileSectionMeta[] = useMemo(
    () => [
      {
        id: "section-identity",
        label: "Identity",
        icon: UserCircle2,
        complete: Boolean(firstName.trim() && lastName.trim()),
      },
      {
        id: "section-trades",
        label: "Trades",
        icon: Hammer,
        complete: Boolean(trade),
      },
      {
        id: "section-area",
        label: "Service area",
        icon: MapPin,
        complete: (radius[0] ?? 0) > 0,
      },
      {
        id: "section-contact",
        label: "Contact",
        icon: Mail,
        complete: Boolean(email.trim() && phone.trim()),
      },
      {
        id: "section-details",
        label: "Details",
        icon: Sparkles,
        complete: Boolean(bio.trim() && languages.length > 0),
      },
    ],
    [firstName, lastName, trade, radius, email, phone, bio, languages],
  );

  return (
    <div className="mt-6 space-y-5 sm:space-y-6">
      <ProfileProgressBar sections={sections} />

      <IdentitySection
        editing={editing}
        firstName={firstName}
        lastName={lastName}
        businessName={businessName}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setBusinessName={setBusinessName}
        onDirty={onDirty}
      />

      <TradesSection
        editing={editing}
        trade={trade}
        setTrade={setTrade}
        meister={meister}
        setMeister={setMeister}
        onDirty={onDirty}
      />

      <ServiceAreaSection
        editing={editing}
        radius={radius}
        setRadius={setRadius}
        onDirty={onDirty}
      />

      <ContactSection
        editing={editing}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        website={website}
        setWebsite={setWebsite}
        onDirty={onDirty}
      />

      <ProfileDetailsSection
        editing={editing}
        bio={bio}
        setBio={setBio}
        logo={logo}
        onPickLogo={onPickLogo}
        teamSize={teamSize}
        setTeamSize={setTeamSize}
        minProjectSize={minProjectSize}
        setMinProjectSize={setMinProjectSize}
        languages={languages}
        activeLangLabels={activeLangLabels}
        toggleLanguage={toggleLanguage}
        onDirty={onDirty}
      />
    </div>
  );
}
