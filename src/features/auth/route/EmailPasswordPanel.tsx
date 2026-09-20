import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Mail, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import type { BusyKey, Mode } from "./types";

interface Props {
  mode: Exclude<Mode, "forgot">;
  busy: BusyKey;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onForgotPassword: () => void;
  onSubmitSignIn: (email: string, password: string) => void | Promise<void>;
  onSubmitSignUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => void | Promise<void>;
  onMagicLink: (email: string) => void | Promise<void>;
}

export function EmailPasswordPanel(props: Props) {
  const {
    mode,
    busy,
    email,
    password,
    fullName,
    phone,
    onEmailChange,
    onPasswordChange,
    onFullNameChange,
    onPhoneChange,
    onForgotPassword,
    onSubmitSignIn,
    onSubmitSignUp,
    onMagicLink,
  } = props;
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "signup") void onSubmitSignUp(email, password, fullName, phone);
    else void onSubmitSignIn(email, password);
  }

  return (
    <form
      className="intake-card intake-card-tone-2 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
      onSubmit={handleSubmit}
    >
      {mode === "signup" && (
        <>
          <div>
            <Label htmlFor="signup-full-name" className="text-slate-200">
              Full name
            </Label>
            <Input
              id="signup-full-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Schmidt"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
          </div>
          <div>
            <Label htmlFor="signup-phone" className="text-slate-200">
              Phone <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id="signup-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+49 170 1234567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
          </div>
        </>
      )}
      <div>
        <Label htmlFor="email" className="text-slate-200">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-200">
            Password
          </Label>
          {mode === "signin" && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-orange hover:text-orange-glow"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="dark-input intake-input border-white/15 bg-white/[0.06] pr-11 text-white placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordStrengthMeter password={password} />
      </div>
      {mode === "signup" ? (
        <Button
          type="submit"
          className="h-11 w-full bg-orange text-white hover:bg-orange/90"
          disabled={busy !== null}
        >
          <UserPlus className="mr-2 size-4" />
          {busy === "signup" ? "Creating account…" : "Create account with password"}
        </Button>
      ) : (
        <>
          <Button
            type="submit"
            className="h-11 w-full bg-orange text-white hover:bg-orange/90"
            disabled={busy !== null}
          >
            <KeyRound className="mr-2 size-4" />
            {busy === "password" ? "Signing in…" : "Sign in with password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void onMagicLink(email)}
            disabled={busy !== null}
            className="h-11 w-full text-slate-200 hover:bg-white/[0.06] hover:text-white"
          >
            <Mail className="mr-2 size-4" />
            {busy === "magic" ? "Sending…" : "Email me a magic link"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="size-3 text-orange" />
            Magic link is optional — password sign-in is the default.
          </p>
        </>
      )}
    </form>
  );
}
