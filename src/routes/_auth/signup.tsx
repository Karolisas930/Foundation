import { createFileRoute } from "@tanstack/react-router";
import { AuthPageBody } from "@/features/auth/route/AuthPageBody";

type SignupSearch = { redirect?: string };

export const Route = createFileRoute("/_auth/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — HANDWERK" },
      { name: "description", content: "Create your HANDWERK account." },
    ],
  }),
  component: SignupRoute,
});

function SignupRoute() {
  return <AuthPageBody initialMode="signup" />;
}
