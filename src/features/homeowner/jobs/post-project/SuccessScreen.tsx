/**
 * SuccessScreen - post-submission view shown after a project is posted.
 * Surfaces the project summary and magic-link confirmation. The
 * password/OAuth "secure your account" flow lives in SecureAccountDialog.tsx;
 * scorePassword/sendMagicLink live in auth-helpers.ts.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/shared/TopBar";
import type { EcosystemProject } from "@/core/demo-session";
import { SummaryRow } from "./parts";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveDashboardPath } from "@/lib/account-role";

export type SuccessState = {
  email: string;
  fullName: string;
  phone: string;
  project: EcosystemProject;
  mediaCount: number;
  hasVoice: boolean;
};

export function SuccessScreen({ success }: { success: SuccessState }) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // The account was created with a password during intake. As soon as a
  // session exists (link clicked, even in another tab), go to the dashboard.
  useEffect(() => {
    if (confirmed) return;
    let done = false;
    const hit = async () => {
      if (done) return;
      done = true;
      setConfirmed(true);
      await navigate({ to: await resolveDashboardPath() });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) void hit();
    });
    // Mobile browsers freeze background tabs, so re-check the moment the
    // person comes back, and when another tab writes the login.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) void hit();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes("auth-token") && e.newValue) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("storage", onStorage);
    const poll = setInterval(check, 2000);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", onStorage);
      sub.subscription.unsubscribe();
    };
  }, [confirmed, navigate]);

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
            <span className="font-semibold text-white break-words">
              "{success.project.title}"
            </span>{" "}
            is now visible to verified Baden-Württemberg trades. The first matched bids are
            already in your dashboard.
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
                  [success.project.city, success.project.locationZip]
                    .filter(Boolean)
                    .join(" · ") || "—"
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
              {confirmed ? "You're confirmed! Opening your dashboard…" : "Confirm your email"}
            </div>
            {!confirmed && (
              <p className="mt-2 text-sm leading-6 text-slate-200">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-white [overflow-wrap:anywhere]">{success.email}</span>. Tap it and
                you'll go straight to your dashboard — this page will also move on by itself.
                Check spam if it hasn't arrived.
              </p>
            )}
          </div>

          {!confirmed && (
            <div className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: success.email,
                    options: {
                      emailRedirectTo: `${window.location.origin}/auth/callback?sector=homeowner&pw=1`,
                    },
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Confirmation email sent again.");
                }}
                className="h-11 rounded-full px-5 font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Resend confirmation email
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
