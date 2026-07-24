/**
 * Pillar 4: 4-digit PinLock overlay used to gate the /chats (messages) route.
 *
 * The pin is stored client-side in localStorage. First visit prompts to
 * set a pin. All styling comes from oklch design tokens (bg-background,
 * text-foreground, ring, primary, muted).
 */
import { useEffect, useMemo, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

const LS_KEY = "handwerk_chat_pin_v1";
const LS_UNLOCKED = "handwerk_chat_pin_unlocked_v1";

type Mode = "set" | "confirm" | "enter";

interface Props {
  children: React.ReactNode;
  /** Optional: how long to stay unlocked in ms after a correct entry. Default: session (until page reload). */
  sessionMs?: number;
}

export function PinLock({ children, sessionMs }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [step, setStep] = useState<Mode>("enter");

  useEffect(() => {
    const stored = typeof window === "undefined" ? null : localStorage.getItem(LS_KEY);
    setSavedPin(stored);
    setStep(stored ? "enter" : "set");

    if (sessionMs && stored) {
      const at = Number(sessionStorage.getItem(LS_UNLOCKED) ?? 0);
      if (at && Date.now() - at < sessionMs) setUnlocked(true);
    }
  }, [sessionMs]);

  const title = useMemo(() => {
    if (step === "set") return "Set a 4-digit PIN";
    if (step === "confirm") return "Confirm your PIN";
    return "Enter your PIN";
  }, [step]);

  const subtitle = useMemo(() => {
    if (step === "set") return "Your chats are private. Pick a PIN to unlock them on this device.";
    if (step === "confirm") return "Re-enter the same 4 digits.";
    return "Chats are locked. Enter your PIN to continue.";
  }, [step]);

  function markUnlocked() {
    setUnlocked(true);
    setError(null);
    setPin("");
    setConfirm("");
    if (sessionMs) sessionStorage.setItem(LS_UNLOCKED, String(Date.now()));
  }

  function onSubmit() {
    setError(null);
    if (step === "set") {
      if (pin.length !== 4) return setError("PIN must be 4 digits");
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (confirm !== pin) return setError("PINs don't match — try again");
      localStorage.setItem(LS_KEY, pin);
      setSavedPin(pin);
      markUnlocked();
      return;
    }
    if (pin === savedPin) markUnlocked();
    else setError("Incorrect PIN");
  }

  function onReset() {
    localStorage.removeItem(LS_KEY);
    sessionStorage.removeItem(LS_UNLOCKED);
    setSavedPin(null);
    setPin("");
    setConfirm("");
    setError(null);
    setStep("set");
    setUnlocked(false);
  }

  if (unlocked) return <>{children}</>;

  const value = step === "confirm" ? confirm : pin;
  const setValue = step === "confirm" ? setConfirm : setPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground p-8 shadow-lg">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="rounded-full bg-primary/10 p-3">
            <LockKeyhole className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex justify-center mb-4">
          <InputOTP
            maxLength={4}
            value={value}
            onChange={(v) => setValue(v.replace(/\D/g, ""))}
            inputMode="numeric"
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive text-center mb-3">
            {error}
          </p>
        ) : null}

        <Button onClick={onSubmit} disabled={value.length !== 4} className="w-full">
          {step === "set" ? "Continue" : step === "confirm" ? "Set PIN" : "Unlock"}
        </Button>

        {savedPin ? (
          <button
            type="button"
            onClick={onReset}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot PIN? Reset (clears local PIN only)
          </button>
        ) : null}
      </div>
    </div>
  );
}
