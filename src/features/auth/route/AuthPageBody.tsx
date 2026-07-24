import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthModeTabs } from "@/features/auth/route/AuthModeTabs";
import { CloudNotConnectedBanner } from "@/features/auth/route/CloudNotConnectedBanner";
import { EmailPasswordPanel } from "@/features/auth/route/EmailPasswordPanel";
import { ForgotPasswordPanel } from "@/features/auth/route/ForgotPasswordPanel";
import { SocialAuthPanel } from "@/features/auth/route/SocialAuthPanel";
import { useAuthActions } from "@/features/auth/route/useAuthActions";
import type { Mode } from "@/features/auth/route/types";

/**
 * Shared inner body for /login, /signup, and the forgot-password screen.
 * Chrome (TopBar, dark bg) is provided by the enclosing `_auth` layout.
 * `initialMode` seeds local state; tab switching stays client-side.
 */
export function AuthPageBody({ initialMode }: { initialMode: Mode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const actions = useAuthActions();

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
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onForgotPassword={() => setMode("forgot")}
            onSubmitSignIn={actions.signInWithPassword}
            onSubmitSignUp={actions.signUpWithPassword}
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
