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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { stampAccountTypeIfMissing, applyPendingProfileFieldsIfAny } from "@/lib/account-type";
import { claimPendingProjects } from "@/lib/pending-projects.functions";
import { dashboardPathFor, readProfileRole } from "@/lib/account-role";
import { ResendConfirmationForm } from "@/features/auth/components/ResendConfirmationForm";


export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

const MAX_WAIT_MS = 15000;
const POLL_INTERVAL_MS = 300;

/**
 * Supabase reports a dead link by bouncing back with error details in the URL
 * hash (`#error=access_denied&error_code=otp_expired&...`) — occasionally in
 * the query string instead. Reading both means an expired link shows the
 * "request a new one" screen immediately instead of after a 15s spin.
 */
function readLinkError(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const code = hash.get("error_code") ?? url.searchParams.get("error_code");
  const err = hash.get("error") ?? url.searchParams.get("error");
  if (!code && !err) return null;
  const described =
    hash.get("error_description") ?? url.searchParams.get("error_description") ?? "";
  return described.replace(/\+/g, " ") || code || err;
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"waiting" | "expired">("waiting");
  const [linkError, setLinkError] = useState<string | null>(null);

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

        const { accountType } = await readProfileRole(userId);
        await navigate({ to: dashboardPathFor(accountType) });
        return;
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

    const failure = readLinkError();
    if (failure) {
      setLinkError(failure);
      setState("expired");
      return () => {
        cancelled = true;
      };
    }

    void waitForSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const sectorSuffix =
    typeof window !== "undefined"
      ? (new URL(window.location.href).searchParams.get("sector") ?? "")
      : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-xl backdrop-blur-sm">
        {state === "expired" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              This link has expired
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {linkError
                ? "That confirmation link is no longer valid — they only last a short while."
                : "We couldn't confirm your account with this link. It may have already been used or it timed out."}
            </p>
            <ResendConfirmationForm
              redirectTo={
                typeof window !== "undefined"
                  ? `${window.location.origin}/auth/callback${sectorSuffix ? `?sector=${sectorSuffix}` : ""}`
                  : undefined
              }
            />
            <p className="mt-4 text-xs text-slate-400">
              Already confirmed?{" "}
              <Link to="/login" className="font-semibold text-orange-glow hover:underline">
                Sign in instead
              </Link>
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

