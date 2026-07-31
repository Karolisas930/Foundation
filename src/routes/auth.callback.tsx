/**
 * /auth/callback — the ONLY place email confirmation / magic links should
 * ever redirect to. Supabase needs a moment to turn the token in the URL
 * into an actual session; landing straight on a protected route (e.g.
 * /homeowner) races that process and the dashboard guard bounces the user
 * before the session exists. This page waits for the session, then routes
 * to the right dashboard - no race, no flash-and-crash.
 */
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/layouts/AuthLayout";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

const MAX_WAIT_MS = 8000;
const POLL_INTERVAL_MS = 300;

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"waiting" | "expired">("waiting");

  useEffect(() => {
    let cancelled = false;

    async function routeToDashboard() {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
          .maybeSingle();
        const accountType = profile?.account_type;
        if (accountType && accountType !== "homeowner") {
          await navigate({ to: "/contractor" });
          return;
        }
      } catch {
        // fall through to homeowner default
      }
      await navigate({ to: "/homeowner" });
    }

    async function waitForSession() {
      const startedAt = Date.now();

      // Fires the instant supabase-js finishes exchanging the URL token
      // for a session - the normal case, usually well under a second.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          sub.subscription.unsubscribe();
          void routeToDashboard();
        }
      });

      // Fallback poll in case the event already fired before we subscribed.
      while (!cancelled && Date.now() - startedAt < MAX_WAIT_MS) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          sub.subscription.unsubscribe();
          await routeToDashboard();
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      if (!cancelled) {
        sub.subscription.unsubscribe();
        setState("expired");
      }
    }

    void waitForSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (state === "expired") {
    return (
      <AuthLayout title="Link expired" subtitle="This confirmation link is no longer valid.">
        <p className="text-sm text-slate-300">
          Please request a new confirmation email and try again.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Confirming your account" subtitle="Just a moment...">
      <div className="flex items-center justify-center py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-glow border-t-transparent" />
      </div>
    </AuthLayout>
  );
    }
