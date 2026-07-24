/**
 * _auth layout — dark chrome for /login, /signup, and forgot-password.
 * Provides the shared TopBar + section so leaf routes render only body
 * content via <Outlet />.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import "../../styles/light-overrides.css";

export const Route = createFileRoute("/_auth")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid text-slate-50">
      <TopBar showSignIn={false} />
      <section className="mx-auto max-w-md px-5 py-8">
        <Outlet />
      </section>
    </main>
  );
}
