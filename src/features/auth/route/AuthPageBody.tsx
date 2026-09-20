import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthModeTabs } from "@/features/auth/route/AuthModeTabs";
import { CloudNotConnectedBanner } from "@/features/auth/route/CloudNotConnectedBanner";
import { EmailPasswordPanel } from "@/features/auth/route/EmailPasswordPanel";
import { ForgotPasswordPanel } from "@/features/auth/route/ForgotPasswordPanel";
import { SocialAuthPanel } from "@/features/auth/route/SocialAuthPanel";
import { useAuthActions } from "@/features/auth/route/useAuthActions";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Mode, SignupSector } from "@/features/auth/route/types";

/**
 * Shared inner body for /login, /signup, and the forgot-password screen.
 * Chrome (TopBar, dark bg) is provided by the enclosing `_auth` layout.
 * `initialMode` seeds local state; tab switching stays client-side.
 */
export function AuthPageBody({
  initialMode,
  sector = "homeowner",
}: {
  initialMode: Mode;
  sector?: SignupSector;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // Set once sign-up succeeds but the address still needs confirming. While
  // this is set we deliberately stay on the auth page instead of navigating
  // to a protected dashboard the visitor cannot reach yet.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<string | null>(null);
  const actions = useAuthActions(sector);

  async function handleSignUp(
    signupEmail: string,
    signupPassword: string,
    signupFullName: string,
    signupPhone: string,
  ) {
    const result = await actions.signUpWithPassword(
      signupEmail,
      signupPassword,
      signupFullName,
      signupPhone,
    );
    if (result === "confirm-email") setAwaitingConfirmation(signupEmail);
  }

  const headings: Record<Mode, { title: string; sub: string }> = {
    signin: {
      title: "Sign in",
      sub: "Continue with a social account, a magic link, or your password.",
    },
    signup: {
      title: "Create your account",
      sub: "Set an email and password to get started.",
    },
    forgot: {
      title: "Reset your password",
      sub: "We'll send a reset link to your email, or a verification code by SMS.",
    },
  };

  function handleBack() {
    if (mode === "forgot") {
      setMode("signin");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      void navigate({ to: "/" });
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-orange" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-white">Check your inbox</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-white">{awaitingConfirmation}</span>. Open it and
          you'll be taken straight to your dashboard.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Nothing there? Check spam, or send the email again.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => void actions.resendConfirmation(awaitingConfirmation)}
            disabled={actions.busy !== null}
            className="h-11 w-full bg-orange text-white hover:bg-orange/90"
          >
            {actions.busy === "signup" ? "Sending…" : "Resend confirmation email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAwaitingConfirmation(null)}
            className="h-11 w-full text-slate-200 hover:bg-white/[0.06] hover:text-white"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-white">{headings[mode].title}</h1>
        <p className="mt-1 text-sm text-slate-300/80">{headings[mode].sub}</p>
      </div>

      {mode !== "forgot" && <AuthModeTabs mode={mode} onChange={setMode} />}

      {!actions.cloudReady && <CloudNotConnectedBanner />}

      {mode === "forgot" ? (
        <ForgotPasswordPanel
          busy={actions.busy}
          initialEmail={email}
          onBackToSignIn={() => setMode("signin")}
          onSendResetEmail={actions.sendResetEmail}
          onSendResetSms={actions.sendResetSms}
          onVerifySmsCode={actions.verifySmsCode}
          onUpdatePassword={actions.updatePasswordAfterSms}
        />
      ) : (
        <>
          <SocialAuthPanel busy={actions.busy} onProvider={actions.signInWithProvider} />

          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-white/10" /> or{" "}
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <EmailPasswordPanel
            mode={mode}
            busy={actions.busy}
            email={email}
            password={password}
            fullName={fullName}
            phone={phone}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onFullNameChange={setFullName}
            onPhoneChange={setPhone}
            onForgotPassword={() => setMode("forgot")}
            onSubmitSignIn={actions.signInWithPassword}
            onSubmitSignUp={handleSignUp}
            onMagicLink={actions.sendMagicLink}
          />
        </>
      )}

      <p className="mt-4 text-center text-sm text-slate-400">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-orange hover:text-orange-glow">
              Sign in
            </Link>
          </>
        ) : mode === "signin" ? (
          <>
            New here?{" "}
            <Link to="/signup" className="font-semibold text-orange hover:text-orange-glow">
              Create an account
            </Link>
            {" · "}
            <Link to="/onboarding" className="font-semibold text-slate-300 hover:text-white">
              Guided onboarding
            </Link>
          </>
        ) : null}
      </p>
    </>
  );
}

export default AuthPageBody;
