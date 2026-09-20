import { createFileRoute } from "@tanstack/react-router";
import { ProfileAppPage } from "@/features/contractor/profile/components/ProfileAppPage";
import { HomeownerSettingsPage } from "@/features/homeowner/settings/components/HomeownerSettingsPage";
import { useDashboard } from "@/routes/_dashboard/route";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Privacy — HANDWERK" },
      {
        name: "description",
        content: "Manage your account, notifications and privacy preferences.",
      },
      { property: "og:title", content: "Settings & Privacy — HANDWERK" },
      {
        property: "og:description",
        content: "Manage your account, notifications and privacy preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

/**
 * One URL, two audiences. This route used to render the contractor
 * ProfileAppPage unconditionally, which is how a homeowner tapping
 * "Preferences" ended up on a tradesperson profile page. Branch on the real
 * account role so neither side ever sees the other's surface.
 */
function SettingsPage() {
  const { isContractor } = useDashboard();

  if (!isContractor) {
    return <HomeownerSettingsPage />;
  }

  return <ProfileAppPage initialPage="settings" />;
}
