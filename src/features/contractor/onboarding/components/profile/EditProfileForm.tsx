/**
 * EditProfileForm — Tab 2: wraps ProfileInfoSection with a save bar.
 * All state lives in HandymanProfilePage; this is a thin presentational
 * shell that surfaces the existing editor inline (not in a modal).
 */
import { Button } from "@/components/ui/button";
import { ProfileInfoSection } from "@/features/contractor/profile/components/ProfileInfoSection";
import { AVAILABLE_LANGUAGES } from "../profile-types";

export interface EditProfileFormProps {
  firstName: string;
  lastName: string;
  businessName: string;
  trade: string;
  radius: number[];
  bio: string;
  languages: string[];
  dirty: boolean;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
  setTrade: (v: string) => void;
  setRadius: (v: number[]) => void;
  setBio: (v: string) => void;
  toggleLanguage: (code: string) => void;
  markDirty: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditProfileForm(p: EditProfileFormProps) {
  const activeLangLabels = AVAILABLE_LANGUAGES.filter((l) => p.languages.includes(l.code));

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">Edit</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Profile details</h2>
        <p className="mt-1 text-sm text-slate-400">
          Identity, trades, service area and contact. Saved fields appear on every quote.
        </p>
      </header>

      <ProfileInfoSection
        editing
        firstName={p.firstName}
        lastName={p.lastName}
        businessName={p.businessName}
        trade={p.trade}
        radius={p.radius}
        bio={p.bio}
        languages={p.languages}
        activeLangLabels={activeLangLabels}
        setFirstName={p.setFirstName}
        setLastName={p.setLastName}
        setBusinessName={p.setBusinessName}
        setTrade={p.setTrade}
        setRadius={p.setRadius}
        setBio={p.setBio}
        toggleLanguage={p.toggleLanguage}
        markDirty={p.markDirty}
      />

      <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-2 border-t border-white/10 bg-[#0f172a]/80 px-2 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={p.onCancel}
          className="text-slate-300 hover:bg-white/5 hover:text-white"
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={p.onSave}
          disabled={!p.dirty}
          className="btn-glow btn-glow-hover h-10 rounded-full px-6 text-xs disabled:opacity-50"
        >
          Save changes
        </Button>
      </div>
    </section>
  );
}
