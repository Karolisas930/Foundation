import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PropertiesPage } from "@/features/homeowner/properties/components/PropertiesPage";

export const Route = createFileRoute("/_dashboard/homeowner/properties")({
  head: () => ({
    meta: [
      { title: "My properties" },
      { name: "description", content: "Manage the buildings you own so every project shows the right address." },
      { property: "og:title", content: "My properties" },
      { property: "og:description", content: "Manage the buildings you own so every project shows the right address." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeownerPropertiesPage,
});

function HomeownerPropertiesPage() {
  return (
    <DashboardLayout>
      <PropertiesPage />
    </DashboardLayout>
  );
}
