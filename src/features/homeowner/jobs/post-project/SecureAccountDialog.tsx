/**
 * The "Secure your account" dialog shown after a guest posts a project.
 * Offers Google, Apple, or password signup - all three route through
 * /auth/callback (see src/routes/auth.callback.tsx) rather than a
 * protected page directly, to avoid racing the session.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { GoogleIcon, AppleIcon } from "@/features/auth/route/provider-icons";
import { scorePassword } from "./auth-helpers";
import { stashPendingProfileFields } from "@/lib/account-type";

type SecureAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  fullName?: string;
  phone?: string;
  onPasswordCreated: () => void;
};

export function SecureAccountDialog({
  open,
  onOpenChange,
  email,
  fullName,
  phone,
  onPasswordCreated,
}: SecureAccountDialogProps) {
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const strength = scorePassword(passwordValue);

  async function signInWithProvider(provider: "google" | "apple") {
    if (!isSupabaseConfigured()) {
      toast.error("Sign-in service isn't connected yet.");
      return;
    }
    // The browser is about to navigate away to the provider and back —
    // this component unmounts in between, so stash full name/phone now
    // and let /auth/callback apply them once a session exists.
    stashPendingProfileFields({ fullName, phone });
    const redirectTo = `${window.location.origin}/auth/callback?sector=homeowner`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) toast.error(error.message);
    } catch {
      const label = provider === "google" ? "Google" : "Apple";
      toast.error(`Couldn't reach ${label} sign-in. Try again in a moment.`);
    }
  }

  const getStrengthColor = (score: number) => {
    if (score <= 1) return "bg-destructive";
    if (score === 2) return "bg-warning";
    return "bg-success";
  };

  const getStrengthWidth = (score: number) => {
    if (score === 0) return "w-0";
    if (score === 1) return "w-1/3";
    if (score === 2) return "w-2/3";
    return "w-full";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[color:var(--navy-deep)] text-slate-100 sm:max-w-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold text-white">
            Secure your account
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Sign in instantly next time - pick a social provider or set a password.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => signInWithProvider("google")}
            className="h-11 justify-center gap-2 rounded-xl border-white/15 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => signInWithProvider("apple")}
            className="h-11 justify-center gap-2 rounded-xl border-white/15 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            <AppleIcon className="size-4" />
            Continue with Apple
          </Button>
        </div>

        <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          <span className="h-px flex-1 bg-white/10" /> or set a password{" "}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (passwordValue.length < 8) {
              toast.error("Password must be at least 8 characters.");
              return;
            }
            if (!isSupabaseConfigured()) {
              toast.error("Sign-up service isn't connected yet.");
              return;
            }
            setPasswordSaving(true);
            try {
              const trimmedFullName = fullName?.trim() || undefined;
              const trimmedPhone = phone?.trim() || undefined;

              const { data: signUpData, error } = await supabase.auth.signUp({
                email,
                password: passwordValue,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback?sector=homeowner`,
                  data: {
                    display_name: trimmedFullName || email.split("@")[0],
                    full_name: trimmedFullName,
                    phone: trimmedPhone,
                    account_type: "homeowner",
                  },
                },
              });

              // Supabase signUp() no-ops (no error, no email, no session) when
              // the email already has an account — it never reveals that via
              // `error` to prevent account enumeration. Detect that case via
              // the empty `identities` array and fall back to signing in with
              // the password just entered, instead of reporting false success.
              const alreadyRegistered =
                !error && !signUpData?.session && signUpData?.user?.identities?.length === 0;

              let signedInUserId: string | undefined;
              let hasActiveSession = false;

              if (alreadyRegistered) {
                const { data: signInData, error: signInError } =
                  await supabase.auth.signInWithPassword({ email, password: passwordValue });
                if (signInData?.session) {
                  signedInUserId = signInData.session.user.id;
                  hasActiveSession = true;
                } else {
                  toast.error(
                    signInError?.message ??
                      "This email already has an account. Try signing in instead.",
                  );
                  return;
                }
              } else if (error) {
                toast.error(error.message);
                return;
              } else if (signUpData?.session) {
                // Email confirmation is off for this project, or was
                // already satisfied — signUp() returned a live session.
                signedInUserId = signUpData.session.user.id;
                hasActiveSession = true;
              }

              // The DB trigger that seeds `profiles` from signUp() metadata
              // now also writes phone (see the handle_new_user migration),
              // so for a brand-new pending-confirmation signup there's no
              // session yet and nothing left for the client to do here —
              // an upsert without a session can't pass RLS and would only
              // add a doomed network round-trip before this button
              // resolves. Only backfill explicitly when a session actually
              // exists (already-registered sign-in, or confirmation-off).
              if (hasActiveSession && signedInUserId) {
                try {
                  await supabase.from("profiles").upsert(
                    {
                      id: signedInUserId,
                      account_type: "homeowner",
                      ...(trimmedFullName
                        ? { full_name: trimmedFullName, display_name: trimmedFullName }
                        : {}),
                      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
                    },
                    { onConflict: "id" },
                  );
                } catch {
                  /* non-fatal — profile row will backfill on next save */
                }
              }

              onPasswordCreated();
            } catch {
              toast.error("An unexpected error occurred. Please try again.");
            } finally {
              setPasswordSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="setpw-email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="setpw-email"
              type="email"
              value={email}
              readOnly
              className="mt-1 border-white/10 bg-white/5 text-slate-200"
            />
          </div>
          <div>
            <Label htmlFor="setpw-password" className="text-slate-200">
              New password
            </Label>
            <Input
              id="setpw-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              required
            />
            <div className="mt-2" aria-live="polite">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)} ${getStrengthWidth(strength.score)}`} />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={passwordSaving || passwordValue.length < 8}
              className="w-full h-11 rounded-xl bg-white font-bold text-slate-900 hover:bg-slate-100"
            >
              {passwordSaving ? "Securing account..." : "Save password & finish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
