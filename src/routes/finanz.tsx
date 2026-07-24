import { createFileRoute } from "@tanstack/react-router";
import { FinancialToolsPage } from "@/features/contractor/tools/components/FinancialToolsPage";
import { AuthGuard } from "@/components/shared/AuthGuard";

type FinanzSearch = { scan?: string; tab?: "receipts" | "trips" };

export const Route = createFileRoute("/finanz")({
  head: () => ({
    meta: [
      { title: "Finanz — Contractor Financial Tools" },
      {
        name: "description",
        content:
          "Finanzamt reserve dashboard, receipt capture with OCR, and km trip tracking for German contractors.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): FinanzSearch => ({
    scan: typeof search.scan === "string" ? search.scan : undefined,
    tab: search.tab === "receipts" || search.tab === "trips" ? search.tab : undefined,
  }),
  component: FinanzPage,
});

function FinanzPage() {
  const { tab, scan } = Route.useSearch();
  return (
    <AuthGuard>
      <FinancialToolsPage initialTab={tab} scanOnOpen={scan === "1"} />
    </AuthGuard>
  );
}
