import { createFileRoute } from "@tanstack/react-router";
import { AuthPageBody } from "@/features/auth/route/AuthPageBody";
import { isSector, type SignupSector } from "@/features/auth/route/types";

type SignupSearch = { redirect?: string; sector?: SignupSector };

export const Route = createFileRoute("/_auth/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    sector: isSector(search.sector) ? search.sector : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — HANDWERK" },
      { name: "description", content: "Create your HANDWERK account." },
      { property: "og:title", content: "Create your account — HANDWERK" },
      { property: "og:description", content: "Create your HANDWERK account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupRoute,
});

function SignupRoute() {
  const { sector } = Route.useSearch();
  return <AuthPageBody initialMode="signup" sector={sector ?? "homeowner"} />;
}
