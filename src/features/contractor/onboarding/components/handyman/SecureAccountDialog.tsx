/**
 * SecureAccountDialog — final onboarding modal: pick a sign-in method
 * (Google, Apple, or email + password with strength meter) so the freshly
 * onboarded professional can access the workspace later.
 */
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { scorePassword } from "@/lib/password-strength";
import { GoogleIcon } from "@/features/contractor/onboarding/components/GoogleIcon";
import { AppleIcon } from "@/features/contractor/onboarding/components/AppleIcon";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  password: string;
  setPassword: (v: string) => void;
  showPw: boolean;
  setShowPw: (updater: (v: boolean) => boolean) => void;
  onFinalize: () => void;
}

export function SecureAccountDialog({
  open,
  onOpenChange,
  submitting,
  password,
  setPassword,
  showPw,
  setShowPw,
  onFinalize,
}: Props) {
  const pwStrength = scorePassword(password);

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure your account</DialogTitle>
          <DialogDescription>
            One last step — pick a sign-in method so you can access your workspace anywhere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2 h-11"
            onClick={async () => {
              try {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/contractor` },
                });
              } catch {
                toast.error("Google sign-in unavailable in demo mode.");
              }
            }}
          >
            <GoogleIcon className="size-4" /> Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2 h-11"
            onClick={async () => {
              try {
                await supabase.auth.signInWithOAuth({
                  provider: "apple",
                  options: { redirectTo: `${window.location.origin}/contractor` },
                });
              } catch {
                toast.error("Apple sign-in unavailable in demo mode.");
              }
            }}
          >
            <AppleIcon className="size-4" /> Continue with Apple
          </Button>
        </div>

        <div className="relative my-1 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pw-modal" className="text-white">
            New password
          </Label>
          <div className="relative">
            <Input
              id="pw-modal"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="intake-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-white"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full transition-all duration-300", pwStrength.bar)}
                  style={{ width: `${pwStrength.percent}%` }}
                />
              </div>
              {pwStrength.label && (
                <p className={cn("mt-1 text-[11px] font-medium", pwStrength.tone)}>
                  {pwStrength.label} · use 8+ characters with a mix of letters, numbers and symbols
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || password.length < 8}
            onClick={onFinalize}
            className="btn-glow btn-glow-hover w-full h-11 rounded-full font-semibold disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
