import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useDashboard } from "@/routes/_dashboard/route";

export const Route = createFileRoute("/_dashboard/homeowner")({
  component: HomeownerGuard,
});

function HomeownerGuard() {
  const { isContractor } = useDashboard();

  if (isContractor) {
    return <Navigate to="/contractor" replace />;
  }

  return <Outlet />;
}
