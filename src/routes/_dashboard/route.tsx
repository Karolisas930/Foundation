/**
 * _dashboard layout — Supabase auth session gateway.
 *
 * Any route file under `src/routes/_dashboard/` is protected by this
 * pathless layout. We disable SSR because the Supabase session lives in
 * localStorage, which the server cannot read (SSR-gating would loop on
 * hard refresh).
 *
 * The client-only `beforeLoad` trusts the LOCAL session first
 * (`getSession()` — reads localStorage and silently refreshes an expired
 * access token) instead of `getUser()`. `getUser()` makes a network
 * round-trip on every protected navigation, so a transient network error
 * or a not-yet-refreshed token would throw and bounce the user to /auth —
 * the "automatic logout" bug. We only redirect when there is genuinely no
 * session and no preview/demo session.
 */
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LegalGateWrapper } from "@/components/legal/LegalGateWrapper";

/**
 * Read `profiles.account_type` for the current user. Never throws — a
 * missing row / RLS block / transient error just yields `null`, and the
 * subtree treats that as "unknown role" (defaults to contractor UI today,
 * but child routes can branch on it).
 */
async function readAccountType(uid: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", uid)
      .maybeSingle();
    const at = (data as { account_type: string | null } | null)?.account_type;
    return at ?? null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/_dashboard")({
  ssr: false,
  // Auth check runs in the component (DashboardGate) rather than in
  // beforeLoad. With ssr:false the server ships an empty Suspense shell
  // for /_dashboard routes; if beforeLoad throws a redirect on the
  // client the /_auth subtree's lazy component module isn't preloaded
  // and React hits a hydration mismatch between `<main>` and the
  // Suspense fallback. Doing the redirect from useEffect (after
  // hydration finishes) sidesteps this entirely.
  component: DashboardGate,
});

function DashboardGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "authed">("pending");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          const accountType = await readAccountType(session.user.id);
          if (cancelled) return;

          const path = window.location.pathname;
          if (accountType === "homeowner" && (path.startsWith("/contractor") || path === "/contractor")) {
            await navigate({ to: "/homeowner", replace: true });
          } else if (accountType && accountType !== "homeowner" && (path.startsWith("/homeowner") || path === "/homeowner")) {
            await navigate({ to: "/contractor", replace: true });
          }

          setStatus("authed");
          return;
        }
      } catch (e) {
        console.warn("[_dashboard] getSession failed:", e);
        if (!cancelled) setStatus("authed");
        return;
      }
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname + window.location.search },
        replace: true,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "pending") {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <LegalGateWrapper>
      <Outlet />
    </LegalGateWrapper>
  );
}
