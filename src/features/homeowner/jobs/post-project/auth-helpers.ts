import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";

export type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: string;
  bar: string;
  percent: number;
};

export function scorePassword(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  if (!pw) return { score: 0, label: "", tone: "text-slate-400", bar: "bg-white/10", percent: 0 };
  if (clamped <= 1)
    return { score: clamped, label: "Weak", tone: "text-red-300", bar: "bg-red-500", percent: 25 };
  if (clamped === 2)
    return {
      score: clamped,
      label: "Medium",
      tone: "text-orange-300",
      bar: "bg-orange-400",
      percent: 55,
    };
  if (clamped === 3)
    return {
      score: clamped,
      label: "Strong",
      tone: "text-emerald-300",
      bar: "bg-emerald-500",
      percent: 80,
    };
  return {
    score: clamped,
    label: "Very strong",
    tone: "text-emerald-300",
    bar: "bg-emerald-500",
    percent: 100,
  };
}

/**
 * Always redirects through /auth/callback, never straight at a protected
 * page - see src/routes/auth.callback.tsx for why.
 */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  }
  const redirectTo = `${window.location.origin}/auth/callback?sector=homeowner`;
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (error && !/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  } catch {
    return { ok: true, message: "Sign-in link sent. Check your inbox (and spam)." };
  }
}
