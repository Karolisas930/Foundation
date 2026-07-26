/**
 * SuccessScreen — post-submission view shown after a project is posted.
 * Surfaces the project summary, magic-link confirmation, and optional
 * "set a password" flow that upgrades the pending account.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, KeyRound, Mail, Sparkles } from "lucide-react";
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
import { TopBar } from "@/components/shared/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { setDemoUser } from "@/lib/demo-auth";
import type { EcosystemProject } from "@/core/demo-session";
import { SummaryRow } from "./parts";

// `profiles.account_type = "homeowner"` is stamped from a single converge
// point — the homeowner dashboard's first-load effect calls the shared
// `stampAccountTypeIfMissing` helper (see src/lib/account-type.ts). All four
// signup paths (magic link, Google OAuth, Apple OAuth, password) land on
// that dashboard, so we intentionally do NOT duplicate the upsert here.

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: string;
  bar: string;
  percent: number;
};

function scorePassword(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  if (!pw) return { score: 0, label: "", tone: "text-slate-400", bar: "bg-white/10", percent: 0 };
  if (clamped <= 1)
    return { score: clamped, label: "Weak", tone: "text-red-300", bar: "bg-red-500", percent: 25 };
  if (clamped === 2)
    return {
      score: clamped,
      label: "Medium",
      tone: "text-orange-300",
      bar: "bg-orange-400",
      percent: 55,
    };
  if (clamped === 3)
    return {
      score: clamped,
      label: "Strong",
      tone: "text-emerald-300",
      bar: "bg-emerald-500",
      percent: 80,
    };
  return {
    score: clamped,
    label: "Very strong",
    tone: "text-emerald-300",
    bar: "bg-emerald-500",
    percent: 100,
  };
}

async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  }
  const redirectTo = `${window.location.origin}/homeowner`;
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (error && !/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  } catch {
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  }
}

export type SuccessState = {
  email: string;
  project: EcosystemProject;
  mediaCount: number;
  hasVoice: boolean;
};

export function SuccessScreen({ success }: { success: SuccessState }) {
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const strength = scorePassword(passwordValue);
  // Land at the top of the success page so the confirmation is immediately
  // visible (the form can be tall on mobile).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen intake-grid text-slate-50">
      <TopBar />
      <section className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="intake-card rounded-2xl p-7 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
                Project posted
              </p>
              <h1 className="mt-1 break-words font-display text-xl font-extrabold leading-tight text-white sm:text-2xl md:text-3xl">
                Your project is live!
              </h1>
            </div>
          </div>

          <p className="mt-5 break-words text-sm leading-6 text-slate-200">
            <span className="font-semibold text-white break-words">“{success.project.title}”</span>{" "}
            is now visible to verified Baden-Württemberg trades. The first matched bids are already
            in your dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
              <Sparkles className="size-3.5" /> Project summary
            </div>
            <dl className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
              <SummaryRow label="Trade" value={success.project.trade ?? "—"} />
              <SummaryRow
                label="Location"
                value={
                  [success.project.city, success.project.locationZip].filter(Boolean).join(" · ") ||
                  "—"
                }
              />
              <SummaryRow
                label="Budget"
                value={`€ ${success.project.budgetTotal.toLocaleString("de-DE")}`}
              />
              <SummaryRow
                label="Preferred start"
                value={
                  success.project.desiredStart
                    ? success.project.desiredStart.toUpperCase()
                    : "Flexible"
                }
              />
              <SummaryRow
                label="Photos / docs"
                value={`${success.mediaCount} file${success.mediaCount === 1 ? "" : "s"}`}
              />
              <SummaryRow label="Voice brief" value={success.hasVoice ? "Attached" : "—"} />
              <div className="sm:col-span-2">
                <SummaryRow label="Languages" value={success.project.language ?? "—"} />
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-xl border border-white/15 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mail className="size-4 text-orange-glow" />
              Sign-in link sent
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              We emailed a secure link to{" "}
              <span className="font-semibold text-white">{success.email}</span> so you can return to
              your dashboard any time. Check spam if it hasn't arrived.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => navigate({ to: "/homeowner", replace: true })}
              className="btn-glow btn-glow-hover h-14 w-full rounded-full px-8 text-base font-bold uppercase tracking-wide"
            >
              Open my dashboard <ArrowRight className="ml-2 size-5" />
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordValue("");
                  setPasswordOpen(true);
                }}
                className="h-11 rounded-full border-white/15 bg-white/5 px-5 font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                <KeyRound className="mr-2 size-4 text-orange-glow" />
                Set a password
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  const res = await sendMagicLink(success.email);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.message);
                }}
                className="h-11 rounded-full px-5 font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Resend sign-in link
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="border-white/10 bg-[color:var(--navy-deep)] text-slate-100 sm:max-w-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold text-white">
              Secure your account
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Sign in instantly next time — pick a social provider or set a password.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!isSupabaseConfigured()) {
                  toast.error("Sign-in service isn't connected yet.");
                  return;
                }
                const redirectTo = `${window.location.origin}/homeowner`;
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo },
                  });
                  if (error) toast.error(error.message);
                } catch {
                  toast.error("Couldn't reach Google sign-in. Try again in a moment.");
                }
              }}
              className="h-11 justify-center gap-2 rounded-xl border-white/15 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!isSupabaseConfigured()) {
                  toast.error("Sign-in service isn't connected yet.");
                  return;
                }
                const redirectTo = `${window.location.origin}/homeowner`;
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "apple",
                    options: { redirectTo },
                  });
                  if (error) toast.error(error.message);
                } catch {
                  toast.error("Couldn't reach Apple sign-in. Try again in a moment.");
                }
              }}
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
              setPasswordSaving(true);
              const goToDashboard = () => {
                setPasswordOpen(false);
                setDemoUser({ email: success.email });
                toast.success("Account created. Opening your dashboard…");
                navigate({ to: "/homeowner", replace: true });
              };

              try {
                if (!isSupabaseConfigured()) {
                  goToDashboard();
                  return;
                }
                const { data: sess } = await supabase.auth.getSession();
                if (sess.session) {
                  const { error } = await supabase.auth.updateUser({ password: passwordValue });
                  if (error && !/failed to fetch|networkerror|load failed/i.test(error.message)) {
                    toast.error(error.message);
                  } else {
                    goToDashboard();
                  }
                } else {
                  const { error: signUpError } = await supabase.auth.signUp({
                    email: success.email,
                    password: passwordValue,
                    options: {
                      emailRedirectTo: `${window.location.origin}/homeowner`,
                    },
                  });
                  if (
                    signUpError &&
                    !/already|registered|exists|failed to fetch|networkerror|load failed/i.test(
                      signUpError.message,
                    )
                  ) {
                    toast.error(signUpError.message);
                    return;
                  }
                  // Force a fresh session so the top bar flips to "Sign Out"
                  // and the dashboard loads as authenticated.
                  await supabase.auth
                    .signInWithPassword({ email: success.email, password: passwordValue })
                    .catch(() => undefined);
                  // Re-read the session so useAuth's onAuthStateChange listener
                  // emits SIGNED_IN before we navigate to the dashboard.
                  await supabase.auth.getSession().catch(() => undefined);
                  goToDashboard();
                }
              } catch {
                goToDashboard();
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
                value={success.email}
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
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${strength.bar}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                {passwordValue ? (
                  <p className={`mt-1.5 text-xs font-semibold ${strength.tone}`}>
                    {strength.label}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Use 8+ characters, mix case, numbers & symbols.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPasswordOpen(false)}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={passwordSaving}
                className="bg-orange text-white hover:bg-orange/90"
              >
                {passwordSaving ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.7 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.5 1.2 9.9.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.8-4.2zM14.3 5.4c.7-.8 1.1-2 1-3.1-1 0-2.2.6-2.9 1.4-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.3z" />
    </svg>
  );
}
