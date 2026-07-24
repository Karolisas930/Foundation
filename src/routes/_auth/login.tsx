import { createFileRoute } from "@tanstack/react-router";
import { AuthPageBody } from "@/features/auth/route/AuthPageBody";
import type { Mode } from "@/features/auth/route/types";

type LoginSearch = { mode?: Mode; redirect?: string; next?: string };

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode: search.mode === "forgot" ? "forgot" : search.mode === "signup" ? "signup" : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — HANDWERK" },
      { name: "description", content: "Sign in to your HANDWERK account." },
    ],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { mode } = Route.useSearch();
  return <AuthPageBody initialMode={mode ?? "signin"} />;
}
