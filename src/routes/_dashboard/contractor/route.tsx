import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useDashboard } from "@/routes/_dashboard/route";
import { isHomeownerType } from "@/lib/account-role";

export const Route = createFileRoute("/_dashboard/contractor")({
  component: ContractorGuard,
});

function ContractorGuard() {
  const { accountType } = useDashboard();

  // Only bounce people we KNOW are homeowners. A null account type means the
  // profile read failed — bouncing there sent contractors to the homeowner
  // dashboard and kept them there.
  if (isHomeownerType(accountType)) {
    return <Navigate to="/homeowner" replace />;
  }

  return <Outlet />;
}
