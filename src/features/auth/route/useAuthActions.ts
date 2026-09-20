import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { describeAuthError } from "./auth-errors";
import { resolveDashboardPath } from "@/lib/account-role";

import type { BusyKey, SignUpResult, SignupSector } from "./types";

export function useAuthActions(sector: SignupSector = "homeowner") {
  const navigate = useNavigate();
  const router = useRouter();
  const [busy, setBusy] = useState<BusyKey>(null);
  const cloudReady = isSupabaseConfigured();

  // Every email/OAuth return trip goes through /auth/callback, never straight
  // at a protected dashboard: the callback page waits for Supabase to turn the
  // token into a real session before routing. `sector` tells it which
  // registration flow this was, so the person lands on the matching dashboard.
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?sector=${sector}`
      : `/auth/callback?sector=${sector}`;
  
  async function goToDashboard() {
    await router.invalidate();
    // Role resolution lives in one place now (retries the profile read and
    // never assumes "homeowner" when the read fails).
    const target = await resolveDashboardPath();
    await navigate({ to: target });
  }


  function requireCloud(unavailableMsg: string): boolean {
    if (!cloudReady) {
      toast.error(unavailableMsg);
      return false;
    }
    return true;
  }

  async function signInWithProvider(provider: "google" | "apple") {
    if (!requireCloud("Lovable Cloud isn't connected yet — sign-in is unavailable.")) return;
    setBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) {
        setBusy(null);
        toast.error(describeAuthError(error, "Couldn't start sign-in."));
      }
    } catch (e) {
      setBusy(null);
      toast.error(describeAuthError(e, "Couldn't start sign-in."));
    }
  }

  async function signInWithPassword(email: string, password: string) {
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — sign-in is unavailable.")) return;
    setBusy("password");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(null);
      if (error) toast.error(describeAuthError(error, "Sign-in failed."));
      else {
        toast.success("Signed in.");
        await goToDashboard();
      }
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Sign-in failed."));
    }
  }

  /**
   * Create an account with email + password.
   *
   * When email confirmation is switched on, Supabase returns `session: null`
   * — the account exists but nobody is signed in yet. Navigating to
   * /homeowner here (what this used to do) put an unauthenticated visitor on
   * a protected route: the dashboard gate flashed and then bounced them, which
   * is the "home page for a second, then a blank screen" report. We now stay
   * on the auth page and hand back "confirm-email" so the UI can ask the
   * person to open the link in their inbox.
   */
  async function signUpWithPassword(
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
  ): Promise<SignUpResult> {
    if (!email || !password) {
      toast.error("Enter your email and a password.");
      return "error";
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return "error";
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — sign-up is unavailable."))
      return "error";
    setBusy("signup");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          // The DB trigger handle_new_user() copies these into public.profiles,
          // so full_name/phone must travel with the sign-up itself.
          data: {
            account_type: sector,
            ...(fullName?.trim()
              ? { full_name: fullName.trim(), display_name: fullName.trim() }
              : {}),
            ...(phone?.trim() ? { phone: phone.trim() } : {}),
          },
        },
      });
      setBusy(null);
      if (error) {
        toast.error(describeAuthError(error, "Sign-up failed."));
        return "error";
      }
      if (!data.session) {
        toast.success("Account created — open the confirmation link in your inbox.");
        return "confirm-email";
      }
      toast.success("Account created.");
      await goToDashboard();
      return "signed-in";
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Sign-up failed."));
      return "error";
    }
  }

  /** Re-send the confirmation email for an address that signed up already. */
  async function resendConfirmation(email: string) {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — sign-up is unavailable.")) return;
    setBusy("signup");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      setBusy(null);
      if (error) toast.error(describeAuthError(error, "Couldn't resend the email."));
      else toast.success("Confirmation email sent again.");
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Couldn't resend the email."));
    }
  }

  async function sendMagicLink(email: string) {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — magic links are unavailable.")) return;
    setBusy("magic");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      });
      setBusy(null);
      if (error) toast.error(describeAuthError(error, "Couldn't send magic link."));
      else toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Couldn't send magic link."));
    }
  }

  async function sendResetEmail(forgotEmail: string) {
    if (!forgotEmail) {
      toast.error("Enter your email address.");
      return;
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — password reset is unavailable.")) return;
    setBusy("forgot-email");
    try {
      const resetRedirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "/reset-password";
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: resetRedirect,
      });
      setBusy(null);
      if (error) toast.error(describeAuthError(error, "Couldn't send reset email."));
      else toast.success("Reset link sent — check your inbox.");
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Couldn't send reset email."));
    }
  }

  async function sendResetSms(forgotPhone: string): Promise<boolean> {
    if (!forgotPhone) {
      toast.error("Enter your phone number (e.g. +49…).");
      return false;
    }
    if (!requireCloud("Lovable Cloud isn't connected yet — password reset is unavailable."))
      return false;
    setBusy("forgot-sms");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: forgotPhone,
        options: { shouldCreateUser: false },
      });
      setBusy(null);
      if (error) {
        toast.error(describeAuthError(error, "Couldn't send verification code."));
        return false;
      }
      toast.success("Verification code sent by SMS.");
      return true;
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Couldn't send verification code."));
      return false;
    }
  }

  async function verifySmsCode(forgotPhone: string, smsCode: string): Promise<boolean> {
    if (!smsCode || smsCode.length < 4) {
      toast.error("Enter the code from your text message.");
      return false;
    }
    setBusy("verify-sms");
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: forgotPhone,
        token: smsCode,
        type: "sms",
      });
      setBusy(null);
      if (error) {
        toast.error(describeAuthError(error, "Code didn't verify."));
        return false;
      }
      toast.success("Verified — set a new password.");
      return true;
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Code didn't verify."));
      return false;
    }
  }

  async function updatePasswordAfterSms(newPassword: string) {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy("update-pw");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setBusy(null);
      if (error) toast.error(describeAuthError(error, "Couldn't update password."));
      else {
        toast.success("Password updated — you're signed in.");
        await goToDashboard();
      }
    } catch (err) {
      setBusy(null);
      toast.error(describeAuthError(err, "Couldn't update password."));
    }
  }

  return {
    busy,
    cloudReady,
    signInWithProvider,
    signInWithPassword,
    signUpWithPassword,
    resendConfirmation,
    sendMagicLink,
    sendResetEmail,
    sendResetSms,
    verifySmsCode,
    updatePasswordAfterSms,
  };
}
