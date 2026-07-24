import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import type { BusyKey } from "./types";

interface Props {
  busy: BusyKey;
  initialEmail: string;
  onBackToSignIn: () => void;
  onSendResetEmail: (email: string) => void | Promise<void>;
  onSendResetSms: (phone: string) => Promise<boolean>;
  onVerifySmsCode: (phone: string, code: string) => Promise<boolean>;
  onUpdatePassword: (newPassword: string) => void | Promise<void>;
}

export function ForgotPasswordPanel(props: Props) {
  const {
    busy,
    initialEmail,
    onBackToSignIn,
    onSendResetEmail,
    onSendResetSms,
    onVerifySmsCode,
    onUpdatePassword,
  } = props;

  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [forgotPhone, setForgotPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  function reset() {
    setSmsSent(false);
    setSmsVerified(false);
    setSmsCode("");
    setNewPassword("");
  }

  async function handleSendSms() {
    const ok = await onSendResetSms(forgotPhone);
    if (ok) setSmsSent(true);
  }

  async function handleVerify() {
    const ok = await onVerifySmsCode(forgotPhone, smsCode);
    if (ok) setSmsVerified(true);
  }

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    void onSendResetEmail(forgotEmail);
  }

  function handleUpdateSubmit(e: FormEvent) {
    e.preventDefault();
    void onUpdatePassword(newPassword);
  }

  return (
    <div className="intake-card intake-card-tone-2 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div
        role="tablist"
        aria-label="Reset channel"
        className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1"
      >
        {(["email", "phone"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={channel === c}
            onClick={() => {
              setChannel(c);
              reset();
            }}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
              channel === c ? "bg-orange text-white shadow-sm" : "text-slate-300 hover:text-white"
            }`}
          >
            {c === "email" ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
            {c === "email" ? "Email link" : "SMS code"}
          </button>
        ))}
      </div>

      {channel === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <Label htmlFor="forgot-email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full bg-orange text-white hover:bg-orange/90"
            disabled={busy !== null}
          >
            <Mail className="mr-2 size-4" />
            {busy === "forgot-email" ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-[11px] text-slate-400">
            We'll email a secure link that opens the new-password screen.
          </p>
        </form>
      ) : !smsVerified ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="forgot-phone" className="text-slate-200">
              Phone number
            </Label>
            <Input
              id="forgot-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+49 151 2345678"
              value={forgotPhone}
              onChange={(e) => setForgotPhone(e.target.value)}
              disabled={smsSent}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
            <p className="mt-1 text-[11px] text-slate-400">Include your country code (e.g. +49).</p>
          </div>
          {!smsSent ? (
            <Button
              type="button"
              onClick={() => void handleSendSms()}
              className="h-11 w-full bg-orange text-white hover:bg-orange/90"
              disabled={busy !== null}
            >
              <Phone className="mr-2 size-4" />
              {busy === "forgot-sms" ? "Sending…" : "Send verification code"}
            </Button>
          ) : (
            <>
              <div>
                <Label htmlFor="sms-code" className="text-slate-200">
                  Verification code
                </Label>
                <Input
                  id="sms-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                  className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400 tracking-widest"
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleVerify()}
                className="h-11 w-full bg-orange text-white hover:bg-orange/90"
                disabled={busy !== null}
              >
                <ShieldCheck className="mr-2 size-4" />
                {busy === "verify-sms" ? "Verifying…" : "Verify code"}
              </Button>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setSmsSent(false);
                    setSmsCode("");
                  }}
                  className="hover:text-white"
                >
                  Use a different number
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendSms()}
                  disabled={busy !== null}
                  className="hover:text-white disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleUpdateSubmit} className="space-y-3">
          <div>
            <Label htmlFor="new-password" className="text-slate-200">
              New password
            </Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="dark-input intake-input border-white/15 bg-white/[0.06] pr-11 text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-white"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <Button
            type="submit"
            className="h-11 w-full bg-orange text-white hover:bg-orange/90"
            disabled={busy !== null}
          >
            <KeyRound className="mr-2 size-4" />
            {busy === "update-pw" ? "Saving…" : "Set new password"}
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={onBackToSignIn}
        className="w-full text-center text-xs font-semibold text-slate-300 hover:text-white"
      >
        ← Back to sign in
      </button>
    </div>
  );
}
