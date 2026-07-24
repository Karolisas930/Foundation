/**
 * Shared password strength scorer used by the auth PasswordStrengthMeter
 * and the contractor onboarding "Secure your account" modal. Kept in
 * src/lib so both flows render an identical meter without duplicate copies.
 */
export type PwStrength = {
  label: string;
  tone: string;
  bar: string;
  percent: number;
};

export function scorePassword(pw: string): PwStrength {
  if (!pw) return { label: "", tone: "text-slate-400", bar: "bg-white/10", percent: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score);
  if (clamped <= 1) return { label: "Weak", tone: "text-red-300", bar: "bg-red-500", percent: 25 };
  if (clamped === 2)
    return { label: "Medium", tone: "text-orange-300", bar: "bg-orange-400", percent: 55 };
  if (clamped === 3)
    return { label: "Strong", tone: "text-emerald-300", bar: "bg-emerald-500", percent: 80 };
  return { label: "Very strong", tone: "text-emerald-300", bar: "bg-emerald-500", percent: 100 };
}
