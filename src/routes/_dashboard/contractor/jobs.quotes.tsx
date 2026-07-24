import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { QuotesPage } from "@/features/contractor/quotes/components/QuotesPage";

export const Route = createFileRoute("/_dashboard/contractor/jobs/quotes")({
  head: () => ({
    meta: [
      { title: "Quotes — HANDWERK" },
      {
        name: "description",
        content:
          "Draft, send, and convert quotes into active jobs or invoices — built for tradespeople.",
      },
    ],
  }),
  component: QuotesRoute,
});

function QuotesRoute() {
  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 text-slate-50">
      <TopBar />
      <main>
        <QuotesPage />
      </main>
      <BottomBar />
    </div>
  );
}
