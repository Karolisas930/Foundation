/**
 * /auth/callback - the ONLY place email confirmation / magic links should
 * ever redirect to. Supabase needs a moment to turn the token in the URL
 * into an actual session; landing straight on a protected route (e.g.
 * /homeowner) races that process and the dashboard guard bounces the user
 * before the session exists. This page waits for the session, claims any
 * project the person posted as a guest before they had an account, then 
 * routes to the right dashboard - no race, no flash-and-crash.
 *
 * Deliberately self-contained - no AuthLayout/TopBar here. TopBar renders
 * AppSideMenu the instant the user is signed in, and AppSideMenu calls
 * useDashboard(), which only works inside the /_dashboard route tree. On
 * this page the user becomes signed-in WHILE still on it (that is the
 * whole point), so using TopBar here crashes the page the moment the
 * session appears, before the redirect below even finishes.
 */
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { stampAccountTypeIfMissing, applyPendingProfileFieldsIfAny } from "@/lib/account-type";
import { claimPendingProjects } from "@/lib/pending-projects.functions";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

const MAX_WAIT_MS = 15000;
const POLL_INTERVAL_MS = 300;

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"waiting" | "expired">("waiting");

  useEffect(() => {
    let cancelled = false;
    const sectorParam = new URL(window.location.href).searchParams.get("sector") as
      | "homeowner"
      | "handyman"
      | "business"
      | "architect"
      | null;

    async function routeToDashboard() {
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        const userId = userResponse.user?.id;

        if (!userId) {
          await navigate({ to: "/homeowner" });
          return;
        }

        if (sectorParam) {
          try {
            await stampAccountTypeIfMissing(sectorParam);
          } catch {
            // non-fatal
          }
        }

        try {
          await applyPendingProfileFieldsIfAny();
        } catch {
          // non-fatal
        }

        try {
          // Move any project posted before sign-up into the new account.
          await claimPendingProjects();
        } catch {
          // non-fatal - the dashboard claims it again on load
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", userId)
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

      const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: { user?: unknown } | null) => {
        if (cancelled) return;
        if (session?.user) {
          sub.subscription.unsubscribe();
          void routeToDashboard();
        }
      });

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-xl backdrop-blur-sm">
        {state === "expired" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              Link expired
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              This confirmation link is no longer valid. Please request a new one and try again.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              Confirming your account
            </h1>
            <p className="mt-2 text-sm text-slate-300">Just a moment...</p>
            <div className="mt-6 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-glow border-t-transparent" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
