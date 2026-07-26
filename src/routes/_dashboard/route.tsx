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

type DashboardContextType = {
  accountType: string;
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
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "authed" | "redirecting">("pending");
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          const userAccountType = await readAccountType(session.user.id);
          setAccountType(userAccountType);
          if (cancelled) return;

          const currentPath = window.location.pathname;
          const isContractor = userAccountType === "handyman" || userAccountType === "business";
          const isHomeowner = userAccountType === "homeowner";

          const wantsContractorRoute = currentPath.startsWith("/dashboard/contractor");
          const wantsHomeownerRoute = currentPath.startsWith("/dashboard/homeowner");

          // Role mismatch: A contractor is trying to access homeowner-only routes.
          if (isContractor && wantsHomeownerRoute) {
            setStatus("redirecting");
            router.queryClient.clear(); // Wipe cache to prevent data leaks.
            navigate({ to: "/dashboard/contractor", replace: true });
            return;
          }

          // Role mismatch: A homeowner is trying to access contractor-only routes.
          if (isHomeowner && wantsContractorRoute) {
            setStatus("redirecting");
            router.queryClient.clear(); // Wipe cache to prevent data leaks.
            navigate({ to: "/dashboard/homeowner", replace: true });
            return;
          }

          // If we are here, the role matches the route or it's a generic dashboard page.
          // It's safe to render.
          setStatus("authed");
          return;
        }

        // No session found, redirect to login.
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

  return (
    <DashboardContext.Provider value={{ accountType }}>
      <LegalGateWrapper>
        <Outlet />
      </LegalGateWrapper>
    </DashboardContext.Provider>
  );
}
