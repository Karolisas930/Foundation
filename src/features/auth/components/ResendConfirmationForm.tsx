/**
 * ResendConfirmationForm — shared "send me that email again" control.
 *
 * Used in two places:
 *  - the "Check your email" screen right after sign-up, so nobody is stuck
 *    staring at an empty inbox with no way forward;
 *  - /auth/callback when the confirmation link has expired.
 *
 * Supabase rate-limits resends, so the button enforces its own 45s cooldown
 * instead of letting people hammer it into an error message.
 */
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COOLDOWN_SECONDS = 45;

export function ResendConfirmationForm({
  defaultEmail = "",
  redirectTo,
  compact = false,
}: {
  /** Pre-fills (and hides) the email field when we already know it. */
  defaultEmail?: string;
  /** Where the new link should land — defaults to /auth/callback. */
  redirectTo?: string;
  /** Renders inline without its own heading. */
  compact?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: address,
        options: {
          emailRedirectTo:
            redirectTo ??
            (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined),
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setCooldown(COOLDOWN_SECONDS);
      toast.success("New confirmation link sent — check your inbox (and spam).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the email.");
    } finally {
      setSending(false);
    }
  }

  const disabled = sending || cooldown > 0;
  const label = sending
    ? "Sending…"
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Resend confirmation email";

  return (
    <form onSubmit={handleResend} className={compact ? "mt-4 space-y-3" : "mt-6 space-y-3"}>
      {!defaultEmail && (
        <div className="space-y-2 text-left">
          <Label htmlFor="resend-email" className="text-xs text-slate-300">
            Your email address
          </Label>
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      )}
      <Button type="submit" variant="outline" className="w-full" disabled={disabled}>
        {label}
      </Button>
      <p className="text-center text-[11px] leading-4 text-slate-400">
        Links expire after a while. Didn't get it? Check your spam folder first.
      </p>
    </form>
  );
}

export default ResendConfirmationForm;
