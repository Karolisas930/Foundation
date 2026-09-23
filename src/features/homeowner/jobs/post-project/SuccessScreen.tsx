/**
 * SuccessScreen - post-submission view shown after a project is posted.
 * Surfaces the project summary and magic-link confirmation. The
 * password/OAuth "secure your account" flow lives in SecureAccountDialog.tsx;
 * scorePassword/sendMagicLink live in auth-helpers.ts.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, KeyRound, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/shared/TopBar";
import type { EcosystemProject } from "@/core/demo-session";
import { SummaryRow } from "./parts";
import { sendMagicLink } from "./auth-helpers";
import { SecureAccountDialog } from "./SecureAccountDialog";
import { useConfirmedRedirect } from "@/features/auth/hooks/useConfirmedRedirect";

export type SuccessState = {
  email: string;
  fullName: string;
  phone: string;
  project: EcosystemProject;
  mediaCount: number;
  hasVoice: boolean;
};

export function SuccessScreen({ success }: { success: SuccessState }) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [postSignup, setPostSignup] = useState(false);
  const confirmed = useConfirmedRedirect(postSignup);

  // Land at the top of the success page so the confirmation is immediately
  // visible (the form can be tall on mobile).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // If the user just set a password, show the confirmation message — and watch
  // for the session appearing (confirmed in another tab) so this screen moves
  // on by itself instead of feeling stuck.
  if (postSignup) {
    return (
      <main className="min-h-screen intake-grid text-slate-50">
        <TopBar />
        <section className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="intake-card rounded-2xl p-7 text-center shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]">
            {confirmed ? (
              <>
                <h2 className="text-xl font-semibold text-white">You're confirmed!</h2>
                <p className="mt-2 text-slate-300">Taking you to your dashboard…</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white">Check your email</h2>
                <p className="mt-2 text-slate-300">
                  We've sent a confirmation link to your email address. Please click the link to
                  complete your registration and access your dashboard.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

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
              Sign-in link sent
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              We emailed a secure link to{" "}
              <span className="font-semibold text-white">{success.email}</span> so you can return
              to your dashboard any time. Check spam if it hasn't arrived.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              onClick={async () => {
                const res = await sendMagicLink(success.email);
                if (res.ok) toast.success(res.message);
                else toast.error(res.message);
              }}
              className="btn-glow btn-glow-hover h-14 w-full rounded-full px-8 text-base font-bold uppercase tracking-wide"
            >
              Sign In & View Dashboard <ArrowRight className="ml-2 size-5" />
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(true)}
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

      <SecureAccountDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        email={success.email}
        fullName={success.fullName}
        phone={success.phone}
        onPasswordCreated={() => setPostSignup(true)}
      />
    </main>
  );
}
