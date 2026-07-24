import { createFileRoute } from "@tanstack/react-router";
import { ProfileAppPage } from "@/features/contractor/profile/components/ProfileAppPage";
import { getTradeSpecialtyBySlug } from "@/api/db/schema";

type ProfileSearch = { specialty?: string };

// Auth is enforced by the /_dashboard pathless layout — no AuthGuard needed here.
export const Route = createFileRoute("/_dashboard/contractor/profile")({
  head: () => ({
    meta: [{ title: "Profile — HANDWERK" }],
  }),
  validateSearch: (search: Record<string, unknown>): ProfileSearch => ({
    specialty:
      typeof search.specialty === "string" && getTradeSpecialtyBySlug(search.specialty)
        ? search.specialty
        : undefined,
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { specialty } = Route.useSearch();
  return <ProfileAppPage initialPage="overview" initialSpecialtySlug={specialty} />;
}
