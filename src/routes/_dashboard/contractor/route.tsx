import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useDashboard } from "@/routes/_dashboard/route";

export const Route = createFileRoute("/_dashboard/contractor")({
  component: ContractorGuard,
});

function ContractorGuard() {
  const { isContractor } = useDashboard();

  if (!isContractor) {
    return <Navigate to="/dashboard/homeowner" replace />;
  }

  return <Outlet />;
}