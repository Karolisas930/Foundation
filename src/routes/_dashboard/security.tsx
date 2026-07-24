import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { SecurityPage } from "@/features/shared/security/components/SecurityPage";

export const Route = createFileRoute("/_dashboard/security")({
  head: () => ({
    meta: [
      { title: "Security — HANDWERK" },
      {
        name: "description",
        content: "Manage two-factor authentication and verify your email and phone number.",
      },
    ],
  }),
  component: SecurityRoute,
});

function SecurityRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <SecurityPage />
      </main>
      <BottomBar />
    </div>
  );
}
