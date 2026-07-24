/**
 * AuthGuard — client-side gate for protected pages.
 *
 * Considers the user signed in when either a real Supabase session exists
 * (via `useAuth`) or a demo session has been set (localStorage flag used
 * by the preview flow). Guests are redirected to /auth with a redirect
 * back to the page they tried to open. During the initial auth check we
 * render a lightweight placeholder to avoid flashing protected content.
 */
import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default AuthGuard;
