import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DownloadsReportsPage } from "@/features/contractor/reports/components/DownloadsReportsPage";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_dashboard/contractor/reports")({
  head: () => ({
    meta: [
      { title: "Downloads & Reports — Handwerk BW" },
      {
        name: "description",
        content: "Export invoices, receipts, staff hours, km logs and a full GDPR data package.",
      },
    ],
  }),
  component: ReportsRoute,
  pendingComponent: ReportsPending,
  errorComponent: ReportsError,
  notFoundComponent: () => (
    <ReportsShellMessage title="Not found">This page could not be located.</ReportsShellMessage>
  ),
});

function ReportsRoute() {
  return <DownloadsReportsPage />;
}

function ReportsPending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading Downloads & Reports…
    </div>
  );
}

function ReportsError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <ReportsShellMessage title="Something went wrong">
      <p className="text-sm text-slate-400">
        {error?.message ?? "The Downloads & Reports page failed to load."}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    </ReportsShellMessage>
  );
}

function ReportsShellMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-2xl border border-white/10 bg-navy-deep/60 p-6 text-center">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <div className="mt-2 text-sm text-slate-300">{children}</div>
      </div>
    </div>
  );
}
