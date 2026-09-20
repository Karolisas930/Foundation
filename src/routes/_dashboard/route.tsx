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
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LegalGateWrapper } from "@/components/legal/LegalGateWrapper";
import { stampAccountTypeIfMissing } from "@/lib/account-type";
import { isContractorType, isHomeownerType, readProfileRole } from "@/lib/account-role";


type DashboardContextType = {
  accountType: string | null;
  displayName: string | null;
  isContractor: boolean;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

/** Hook to access the current user's account type within the dashboard. */
export function useDashboard() {
  const context = useContext(DashboardContext);
  // Shared chrome (TopBar -> AppSideMenu, BottomBar) can render outside the
  // /_dashboard tree — e.g. on the home page the instant a session appears
  // after email confirmation, or on public profile pages. Throwing there
  // white-screens the whole app, so fall back to a neutral, safe default.
  return (
    context ?? {
      accountType: null,
      displayName: null,
      isContractor: false,
    }
  );
}

/**
 * Read `profiles.account_type` and `display_name` for the current user.
 * Delegates to the shared helper, which retries once and reports whether
 * the read actually succeeded (see `@/lib/account-role`).
 */
async function readProfileData(uid: string) {
  return readProfileRole(uid);
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
  const queryClient = useQueryClient();
  // The gate must re-evaluate after its own role-mismatch redirect: the
  // layout stays mounted across /homeowner <-> /contractor, so without the
  // pathname in the dependency list `status` would stay "redirecting"
  // forever and the user is left staring at a blank screen.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
          let profile = await readProfileData(session.user.id);

          // Only stamp a default role when the read SUCCEEDED and there is
          // genuinely no role on file. Stamping after a failed read used to
          // overwrite a real contractor profile with "homeowner" and then
          // park them on the homeowner dashboard for good.
          if (profile.ok && !profile.accountType) {
            await stampAccountTypeIfMissing("homeowner", session.user.email);
            profile = await readProfileData(session.user.id);
          }

          const userAccountType = profile.accountType;
          setAccountType(userAccountType);
          setDisplayName(profile.displayName);
          if (cancelled) return;

          const currentPath = window.location.pathname;
          const isContractor = isContractorType(userAccountType);
          const isHomeowner = isHomeownerType(userAccountType);

          const wantsContractorRoute = currentPath.startsWith("/contractor");
          const wantsHomeownerRoute = currentPath.startsWith("/homeowner");

          // Role mismatch: A contractor is trying to access homeowner-only routes.
          // Explain the bounce instead of silently teleporting them — landing
          // somewhere you didn't click reads as a bug otherwise.
          if (isContractor && wantsHomeownerRoute) {
            setStatus("redirecting");
            queryClient.clear(); // Wipe cache to prevent data leaks.
            toast.info("That page is for homeowners — here's your tradesperson workspace.");
            navigate({ to: "/contractor", replace: true });
            return;
          }

          // Role mismatch: A homeowner is trying to access contractor-only routes.
          if (isHomeowner && wantsContractorRoute) {
            setStatus("redirecting");
            queryClient.clear(); // Wipe cache to prevent data leaks.
            toast.info("That page is for tradespeople — here's your project dashboard.");
            navigate({ to: "/homeowner", replace: true });
            return;
          }

          // Role unknown (the profile read failed): render the page the user
          // asked for instead of bouncing them to the wrong dashboard.
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
  }, [navigate, queryClient, pathname]);

  // Render nothing until the auth check is complete and successful.
  // This prevents any child components from rendering with the wrong data.
  if (status !== "authed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  const isContractor = accountType !== null && accountType !== "homeowner";

  return (
    <DashboardContext.Provider value={{ accountType, displayName, isContractor }}>
      <LegalGateWrapper>
        <Outlet />
      </LegalGateWrapper>
    </DashboardContext.Provider>
  );
}
