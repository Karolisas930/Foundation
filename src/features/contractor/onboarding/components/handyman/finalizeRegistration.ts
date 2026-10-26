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
): Promise<{ signedIn: boolean; error?: string }> {
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

  const saveProfileRow = async (uid: string) => {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: uid,
        full_name: `${profile.firstName} ${profile.lastName}`.trim() || null,
        display_name: profile.businessName || null,
        account_type: "handyman",
        phone: profile.mobilePhone || null,
        postal_code: profile.postalCode || null,
        city: profile.city || null,
        address_line1: profile.streetAddress || null,
        service_radius_km: profile.radiusKm,
        min_project_size: profile.minProjectSize,
      },
      { onConflict: "id" },
    );
    return error?.message;
  };

  // Already signed in (e.g. a homeowner adding a trade profile): never ask for
  // a new account — just save the profile onto the current user.
  if (isSupabaseConfigured()) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUid = userData?.user?.id;
      if (currentUid) {
        const failure = await saveProfileRow(currentUid);
        if (failure) return { signedIn: true, error: failure };
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: `${profile.firstName} ${profile.lastName}`.trim(),
              display_name:
                profile.businessName || `${profile.firstName} ${profile.lastName}`.trim(),
              account_type: "handyman",
              sector: "handyman",
              phone: profile.mobilePhone || undefined,
            },
          });
        } catch {
          /* metadata refresh is best effort */
        }
        return { signedIn: true };
      }
    } catch {
      /* fall through to the sign-up path */
    }
  }

  if (!isSupabaseConfigured()) {
    return { signedIn: false, error: "Sign-up is not connected — no confirmation email could be sent." };
  }
  if (!profile.businessEmail || !password) {
    return { signedIn: false, error: "Enter your business email and a password to create the account." };
  }

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: profile.businessEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?sector=handyman&pw=1`,
        data: {
          full_name: `${profile.firstName} ${profile.lastName}`.trim(),
          display_name: profile.businessName || `${profile.firstName} ${profile.lastName}`.trim(),
          account_type: "handyman",
          phone: profile.mobilePhone || undefined,
          sector: "handyman",
        },
      },
    });
    if (signUpError) {
      console.error("[handyman signup] failed:", signUpError);
      return { signedIn: false, error: `Sign-up failed: ${signUpError.message}` };
    }
    // Supabase hides "email already registered": it returns a user with no
    // identities and sends NO email. Say so instead of "check your inbox".
    if (signUpData?.user && (signUpData.user.identities?.length ?? 0) === 0) {
      return {
        signedIn: false,
        error: "This email already has an account — sign in or use “Forgot password”.",
      };
    }
    signedIn = !!signUpData?.session;
    if (signedIn && signUpData.session?.user?.id) {
      const failure = await saveProfileRow(signUpData.session.user.id);
      if (failure) console.error("[handyman signup] profile save failed:", failure);
    }
  } catch (err) {
    console.error("[handyman signup] network error:", err);
    surfacedError = "Couldn't reach the sign-up server — check your connection and try again.";
  }

  return { signedIn, error: surfacedError };
}
