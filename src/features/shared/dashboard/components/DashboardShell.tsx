import { useEffect } from "react";
import { Chameleon } from "@/core/DynamicSectorRenderer";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { getDemoUser, setDemoUser } from "@/lib/demo-auth";
import type { SectorId } from "@/core/sector-config";

export function DashboardShell({ sector }: { sector: SectorId }) {
  useEffect(() => {
    // Reaching the dashboard implies completing onboarding / sign-in in the
    // demo flow. Mark a demo session so the TopBar flips to "Sign Out".
    if (!getDemoUser()) setDemoUser({ name: "You" });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-50">
      <TopBar />
      <div className="min-w-0 pb-24">
        <Chameleon sector={sector} />
      </div>
      <BottomBar />
    </div>
  );
}
