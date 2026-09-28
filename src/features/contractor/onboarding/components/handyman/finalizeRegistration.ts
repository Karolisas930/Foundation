/**
 * finalizeHandymanRegistration — persists the completed onboarding profile
 * into the demo ledger, flips the demo-auth flag, and (when Cloud is
 * configured) creates a real Supabase account and mirrors the matching-
 * critical fields into the `profiles` row. Kept side-effect-only so the
 * wizard component stays presentational.
 */
import { startDemoSession } from "@/core/demo-session";
import { setDemoUser } from "@/lib/demo-auth";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { persistOnboardingProfile } from "@/components/shared/shared";
import { saveProfileFields, toAuthMetadata, type ProfileFields } from "@/lib/profile-sync";

export interface OnboardingProfileInput {
  firstName: string;
  lastName: string;
  businessName: string;
  businessEmail: string;
  mobilePhone: string;
  streetAddress: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  stateName: string;
  teamSize: number;
  minProjectSize: number;
  bio: string;
  languages: string[];
  trades: string[];
  radiusKm: number;
  avatarDataUrl: string | null;
}

export async function finalizeHandymanRegistration(
  input: OnboardingProfileInput,
  password: string | null,
): Promise<{ signedIn: boolean; error?: string; alreadyRegistered?: boolean; emailSent?: boolean }> {
  const profile = {
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    businessName: input.businessName.trim(),
    businessEmail: input.businessEmail.trim().toLowerCase(),
    mobilePhone: input.mobilePhone.trim(),
    streetAddress: [input.streetAddress.trim(), input.houseNumber.trim()].filter(Boolean).join(" "),
    houseNumber: input.houseNumber.trim(),
    postalCode: input.postalCode.trim(),
    city: input.city.trim(),
    state: input.stateName.trim(),
    bio: input.bio.trim().slice(0, 1200),
  };

  persistOnboardingProfile("handyman", profile);
  startDemoSession("handyman");
  setDemoUser({
    email: profile.businessEmail,
    name: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.businessName,
  });

  let signedIn = false;
  let surfacedError: string | undefined;
  let alreadyRegistered = false;
  let emailSent = false;

  const fields: ProfileFields = {
    accountType: "handyman",
    fullName: `${profile.firstName} ${profile.lastName}`.trim(),
    displayName: profile.businessName || `${profile.firstName} ${profile.lastName}`.trim(),
    companyName: profile.businessName,
    phone: profile.mobilePhone,
    postalCode: profile.postalCode,
    city: profile.city,
    addressLine1: profile.streetAddress,
    bio: profile.bio,
    trades: profile.trades,
    languages: profile.languages,
    serviceRadiusKm: profile.radiusKm,
    minProjectSize: profile.minProjectSize,
  };
  const saveProfileRow = (uid: string) => saveProfileFields(uid, fields);

  // Already signed in (e.g. a homeowner adding a trade profile): never ask for
  // a new account — just save the profile onto the current user.
  if (isSupabaseConfigured()) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUid = userData?.user?.id;
      if (currentUid) {
        const failure = await saveProfileRow(currentUid);
        if (failure) return { signedIn: true, error: failure };
        return { signedIn: true };
      }
    } catch {
      /* fall through to the sign-up path */
    }
  }

  if (isSupabaseConfigured() && profile.businessEmail && password) {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: profile.businessEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?sector=handyman`,
          data: toAuthMetadata(fields),
        },
      });
      signedIn = !!signUpData?.session;
      // Supabase hides "email taken" behind a fake success whose user has no
      // identities — and in that case NO confirmation email is sent.
      const identities = signUpData?.user?.identities;
      if (!signUpError && signUpData?.user && Array.isArray(identities) && identities.length === 0) {
        alreadyRegistered = true;
      } else if (!signUpError && signUpData?.user && !signedIn) {
        emailSent = true;
      }
      if (!signedIn) {
        const { data: signInData } = await supabase.auth
          .signInWithPassword({ email: profile.businessEmail, password })
          .catch(() => ({ data: { session: null } }) as { data: { session: unknown | null } });
        signedIn = !!signInData?.session;
      }
      if (signedIn) {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData?.session?.user?.id;
        if (uid) {
          try {
            await saveProfileRow(uid);
          } catch {
            /* non-fatal — profile row will backfill on next save */
          }
        }
      }
      if (signUpError && !signedIn) {
        if (/already|registered|exists/i.test(signUpError.message)) {
          alreadyRegistered = true;
        } else if (/rate limit|too many/i.test(signUpError.message)) {
          surfacedError =
            "Too many confirmation emails were requested. Please wait a few minutes and use \"Resend\".";
        } else if (/failed to fetch|networkerror|load failed/i.test(signUpError.message)) {
          surfacedError = "Could not reach the server. Check your connection and try again.";
        } else {
          surfacedError = signUpError.message;
        }
      }
    } catch (err) {
      surfacedError = err instanceof Error ? err.message : "Sign-up failed.";
    }
  }

  return { signedIn, error: surfacedError, alreadyRegistered, emailSent };
}
