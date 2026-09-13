import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TradespersonBrowseList } from "@/features/homeowner/profile/components/TradespersonBrowseList";

export const Route = createFileRoute("/_dashboard/homeowner/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Tradesperson</h1>
          <p className="text-slate-300">
            Browse public profiles by trade or city. Sign in and send a message to unlock contact
            details.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by trade or city (e.g. plumber, Berlin)"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 py-2.5 pl-10 pr-3 text-white placeholder:text-slate-500 focus:border-orange-glow focus:outline-none"
          />
        </div>

        <TradespersonBrowseList search={search} />
      </div>
    </DashboardLayout>
  );
}
