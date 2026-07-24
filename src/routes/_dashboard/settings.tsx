import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileAppPage } from "@/features/contractor/profile/components/ProfileAppPage";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({
    meta: [{ title: "Settings & Privacy — HANDWERK" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <div className="fixed right-3 top-3 z-50">
        <Link
          to="/dev"
          className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-medium text-emerald-950 shadow-lg backdrop-blur hover:bg-emerald-400"
        >
          Dev tools
        </Link>
      </div>
      <ProfileAppPage initialPage="settings" />
    </>
  );
}
