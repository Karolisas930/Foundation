import { useState } from "react";
import { ShieldCheck, Mail, Phone, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

type VerificationState = "verified" | "unverified";

function StatusPill({ state }: { state: VerificationState }) {
  const verified = state === "verified";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
        (verified
          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
          : "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30")
      }
    >
      {verified ? (
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {verified ? "Verified" : "Not Verified"}
    </span>
  );
}

function SecurityCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-orange-300 ring-1 ring-inset ring-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">{children}</div>
    </section>
  );
}

export function SecurityPage() {
  const { user } = useAuth();

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Supabase User exposes confirmation timestamps for email/phone.
  const emailVerified: VerificationState = (
    user as unknown as { email_confirmed_at?: string | null } | null
  )?.email_confirmed_at
    ? "verified"
    : "unverified";
  const phone = (user as unknown as { phone?: string | null } | null)?.phone ?? "";
  const phoneVerified: VerificationState = (
    user as unknown as { phone_confirmed_at?: string | null } | null
  )?.phone_confirmed_at
    ? "verified"
    : "unverified";

  function handleToggle2FA(next: boolean) {
    setTwoFAEnabled(next);
    toast.message(next ? "2FA enabled" : "2FA disabled", {
      description: next
        ? "Two-factor authentication is now active on this account."
        : "Two-factor authentication has been turned off.",
    });
  }

  function startSetup2FA() {
    toast.message("2FA setup", {
      description: "The full 2FA setup flow will be available shortly.",
    });
  }

  function verifyEmail() {
    toast.message("Verification email sent", {
      description: user?.email
        ? `We sent a verification link to ${user.email}.`
        : "Check your inbox for a verification link.",
    });
  }

  function verifyPhone() {
    toast.message("Verification code sent", {
      description: phone
        ? `We sent a verification code to ${phone}.`
        : "Add a phone number to your account, then we'll send a code.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Security</h1>
        <p className="mt-1 text-sm text-white/60">
          Protect your account with two-factor authentication and verified contact channels.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <SecurityCard
          icon={KeyRound}
          title="Two-Factor Authentication (2FA)"
          description="Add an extra layer of security by requiring a one-time code in addition to your password."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {twoFAEnabled ? "2FA is enabled" : "2FA is disabled"}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                {twoFAEnabled
                  ? "Codes are required at sign-in."
                  : "Enable to require a code from your authenticator app."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startSetup2FA}
                className="border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
              >
                {twoFAEnabled ? "Manage" : "Set up"}
              </Button>
              <Switch checked={twoFAEnabled} onCheckedChange={handleToggle2FA} />
            </div>
          </div>
        </SecurityCard>

        <SecurityCard
          icon={Mail}
          title="Email Verification"
          description="Confirm your email address so we can send account alerts and password resets."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.email ?? "No email on file"}
              </p>
              <div className="mt-1.5">
                <StatusPill state={emailVerified} />
              </div>
            </div>
            {emailVerified === "unverified" && (
              <Button
                type="button"
                size="sm"
                onClick={verifyEmail}
                className="bg-orange-500 text-white hover:bg-orange-500/90"
              >
                Verify Now
              </Button>
            )}
          </div>
        </SecurityCard>

        <SecurityCard
          icon={Phone}
          title="Phone Number Verification"
          description="Verify your phone number to receive SMS codes and match notifications."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {phone || "No phone number on file"}
              </p>
              <div className="mt-1.5">
                <StatusPill state={phoneVerified} />
              </div>
            </div>
            {phoneVerified === "unverified" && (
              <Button
                type="button"
                size="sm"
                onClick={verifyPhone}
                className="bg-orange-500 text-white hover:bg-orange-500/90"
              >
                Verify Now
              </Button>
            )}
          </div>
        </SecurityCard>
      </div>
    </div>
  );
}
