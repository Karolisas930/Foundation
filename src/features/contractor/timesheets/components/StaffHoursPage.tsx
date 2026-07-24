/**
 * StaffHoursPage — thin coordinator for the manager's Staff Hours screen.
 *
 * Loads rows + mutations via useStaffHoursData and renders either the
 * "Review & Approve" tab or the "Pay Calculation" tab. All sub-components
 * live under src/features/contractor/timesheets/components/.
 */
import { useState } from "react";
import { Clock, Euro } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useStaffHoursData } from "./useStaffHoursData";
import { ReviewTab } from "./ReviewTab";
import { PayCalculationSection } from "./PayCalculationSection";

export function StaffHoursPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { rows, loading, rates, setRate, updateStatus, updateRow, jobOptions, staffOptions } =
    useStaffHoursData(userId);
  const [activeTab, setActiveTab] = useState<"review" | "pay">("review");

  const isLoading = authLoading || loading;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Staff Hours</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review, approve, and export working hours logged by your crew.
        </p>
      </header>

      <div className="mb-5 inline-flex rounded-lg border border-white/10 bg-white/5 p-1 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
            activeTab === "review"
              ? "bg-orange-500/20 text-orange-200"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          Review & Approve
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pay")}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
            activeTab === "pay"
              ? "bg-orange-500/20 text-orange-200"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Euro className="h-4 w-4" />
          Pay Calculation
        </button>
      </div>

      {activeTab === "pay" ? (
        <PayCalculationSection
          rows={rows}
          staff={staffOptions}
          rates={rates}
          onRateChange={setRate}
          loading={isLoading}
        />
      ) : (
        <ReviewTab
          rows={rows}
          loading={isLoading}
          updateStatus={updateStatus}
          updateRow={updateRow}
          jobOptions={jobOptions}
          staffOptions={staffOptions}
        />
      )}
    </div>
  );
}
