import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { TopBar } from "@/components/shared/TopBar";
import "../styles/light-overrides.css";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — HANDWERK" },
      { name: "description", content: "Set a new password for your HANDWERK account." },
    ],
  }),
  component: ResetPasswordPage,
});

function describeError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message ?? "");
    return msg || fallback;
  }
  return fallback;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const cloudReady = isSupabaseConfigured();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cloudReady) {
      setReady(true);
      return;
    }
    // Supabase auto-consumes the recovery hash on the client and emits a
    // PASSWORD_RECOVERY event / active session.
    const { data: sub } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setHasSession(true);
      }
    });
    void supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (data.session) setHasSession(true);
      setReady(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [cloudReady]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (error) {
        toast.error(describeError(error, "Couldn't update password."));
        return;
      }
      toast.success("Password updated — you're signed in.");
      await router.invalidate();
      await navigate({ to: "/homeowner" });
    } catch (err) {
      setBusy(false);
      toast.error(describeError(err, "Couldn't update password."));
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid text-slate-50">
      <TopBar showSignIn={false} />

      <section className="mx-auto max-w-md px-5 py-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-white">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-300/80">
            Enter a new password to finish resetting your account.
          </p>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Preparing your reset session…
          </div>
        ) : !hasSession ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">This reset link is invalid or has expired.</p>
            <p className="mt-1 text-amber-200/80">
              Request a new reset link from the sign-in page and try again.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="mt-3 h-10 bg-orange text-white hover:bg-orange/90"
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="intake-card intake-card-tone-2 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div>
              <Label htmlFor="new-password" className="text-slate-200">
                New password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark-input intake-input border-white/15 bg-white/[0.06] pr-11 text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-white"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-slate-200">
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full bg-orange text-white hover:bg-orange/90"
              disabled={busy}
            >
              {busy ? (
                <>
                  <ShieldCheck className="mr-2 size-4" />
                  Saving…
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 size-4" />
                  Save new password
                </>
              )}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
