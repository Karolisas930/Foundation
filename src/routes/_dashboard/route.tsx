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
import { createFileRoute, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LegalGateWrapper } from "@/components/legal/LegalGateWrapper";
import { stampAccountTypeIfMissing } from "@/lib/account-type";

type DashboardContextType = {
  accountType: string | null;
  displayName: string | null;
  isContractor: boolean;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

/** Hook to access the current user's account type within the dashboard. */
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a component wrapped by DashboardGate");
  }
  return context;
}

/**
 * Read `profiles.account_type` and `display_name` for the current user.
 * Never throws — a missing row / RLS block / transient error just yields `null`.
 */
async function readProfileData(
  uid: string,
): Promise<{ accountType: string | null; displayName: string | null }> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("account_type, display_name")
      .eq("id", uid)
      .maybeSingle();
    return {
      accountType: (data as { account_type: string | null } | null)?.account_type ?? null,
      displayName: (data as { display_name: string | null } | null)?.display_name ?? null,
    };
  } catch {
    return { accountType: null, displayName: null };
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
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "authed" | "redirecting">("pending");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          let { accountType: userAccountType, displayName: userDisplayName } =
            await readProfileData(session.user.id);

          // Safety net: some entry points (plain magic-link login, direct
          // OAuth returns with no `?sector=` param) never call
          // stampAccountTypeIfMissing, so profiles.account_type can be
          // NULL here. Without this, the render guard below blocks
          // forever on a blank screen because accountType never becomes
          // truthy. Default new/unstamped users to "homeowner" — the
          // same default the auth callback and login flows already use.
          if (!userAccountType) {
            await stampAccountTypeIfMissing("homeowner", session.user.email);
            ({ accountType: userAccountType, displayName: userDisplayName } =
              await readProfileData(session.user.id));
          }

          setAccountType(userAccountType);
          setDisplayName(userDisplayName);
          if (cancelled) return;

          const currentPath = window.location.pathname;
          const isContractor = userAccountType === "handyman" || userAccountType === "business";
          const isHomeowner = userAccountType === "homeowner";

          const wantsContractorRoute = currentPath.startsWith("/contractor");
          const wantsHomeownerRoute = currentPath.startsWith("/homeowner");

          // Role mismatch: A contractor is trying to access homeowner-only routes.
          if (isContractor && wantsHomeownerRoute) {
            setStatus("redirecting");
            router.queryClient.clear(); // Wipe cache to prevent data leaks.
            navigate({ to: "/contractor", replace: true });
            return;
          }

          // Role mismatch: A homeowner is trying to access contractor-only routes.
          if (isHomeowner && wantsContractorRoute) {
            setStatus("redirecting");
            router.queryClient.clear(); // Wipe cache to prevent data leaks.
            navigate({ to: "/homeowner", replace: true });
            return;
          }

          // If we are here, the role matches the route or it's a generic dashboard page.
          // It's safe to render.
          setStatus("authed");
          return;
        }

        // No session found. However, if we're landing on the Supabase
        // callback page (or the URL contains auth tokens) we must NOT
        // immediately redirect — the callback component needs a chance
        // to let Supabase convert the token into a session.
        const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
        const isAuthCallback =
          url &&
          (url.pathname === "/auth/callback" || url.searchParams.has("access_token") || url.searchParams.has("type") || url.searchParams.has("provider_token"));

        if (isAuthCallback) {
          // Defer redirecting and let the callback component mount.
          if (!cancelled) setStatus("pending");
          return;
        }

        // Otherwise, redirect to login as before.
        setStatus("redirecting");
        navigate({
          to: "/login",
          search: { redirect: window.location.pathname + window.location.search },
          replace: true,
        });
      } catch (e) {
        console.warn("[_dashboard] getSession failed:", e);
        if (!cancelled) setStatus("authed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, router.queryClient]);

  // Render nothing until the auth check is complete and successful.
  // This prevents any child components from rendering with the wrong data.
  if (status !== "authed" || !accountType) {
    return <div className="min-h-screen bg-background" />;
  }

  const isContractor = accountType !== "homeowner";

  return (
    <DashboardContext.Provider value={{ accountType, displayName, isContractor }}>
      <LegalGateWrapper>
        <Outlet />
      </LegalGateWrapper>
    </DashboardContext.Provider>
  );
}
