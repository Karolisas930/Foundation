import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Read 'account_type' straight from the URL (e.g. ?account_type=handyman).
  // Router-typed useSearch is not usable here: this form renders on several
  // routes, so no single `from` path is valid.
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const account_type = new URLSearchParams(search ?? "").get("account_type") ?? "homeowner";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // This is the critical part: pass the extra data in `options.data`.
    // The `handle_new_user` trigger in the database will copy this into `public.profiles`.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?sector=${account_type}`,
        data: {
          full_name: fullName,
          display_name: fullName,
          account_type: account_type,
        },
      },
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // On success, update the UI to show the "Check your email" message.
    setIsSubmitted(true);
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback?sector=${account_type}`,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-up failed");
      return;
    }
    if (result.redirected) return;
    onSuccess?.();
  }

  // If the form has been submitted successfully, show the confirmation message.
  if (isSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-slate-300">
          We've sent a confirmation link to your email address. Please click the link to complete your registration.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating account..." : "Create account"}
      </Button>
      <div className="relative py-2 text-center text-xs text-muted-foreground">
        <span className="bg-background px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>
    </form>
  );
}
