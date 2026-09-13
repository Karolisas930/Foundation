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

type SecureAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onPasswordCreated: () => void;
};

export function SecureAccountDialog({
  open,
  onOpenChange,
  email,
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
    const redirectTo = `${window.location.origin}/auth/callback`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) toast.error(error.message);
    } catch {
      const label = provider === "google" ? "Google" : "Apple";
      toast.error(`Couldn't reach ${label} sign-in. Try again in a moment.`);
    }
  }

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
              const { error } = await supabase.auth.signUp({
                email,
                password: passwordValue,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) {
                toast.error(error.message);
              } else {
                onPasswordCreated();
              }
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
