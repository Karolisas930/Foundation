/**
 * PerformancePanel — Private performance dashboard.
 *
 * Real-data only: every figure starts empty and fills in from completed
 * jobs, invoices and client ratings. No invented revenue or ratings.
 */
import { Clock, Award, Target } from "lucide-react";

export interface PerformancePanelProps {
  avgResponseHours?: number | null;
  averageRating?: number | null;
  reviewCount?: number;
  jobsCompleted?: number;
  revenueEur?: number | null;
  onTimePct?: number | null;
  repeatClients?: number | null;
}

export function PerformancePanel({
  avgResponseHours = null,
  averageRating = null,
  reviewCount = 0,
  jobsCompleted = 0,
  revenueEur = null,
  onTimePct = null,
  repeatClients = null,
}: PerformancePanelProps) {
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const num = (v: number | null) => (v == null ? "—" : String(v));

  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="font-display text-lg font-bold text-white">My Performance</h3>
        <p className="text-slate-400 text-sm">{monthLabel} • Private view</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Clock className="mx-auto mb-3 size-8 text-orange" />
          <p className="text-4xl font-display font-bold text-white">
            {avgResponseHours == null ? "—" : `${avgResponseHours}h`}
          </p>
          <p className="text-sm text-slate-400 mt-1">Avg. Response Time</p>
          <p className="text-xs text-slate-500">
            {avgResponseHours == null ? "No enquiries yet" : "Last 30 days"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Award className="mx-auto mb-3 size-8 text-orange" />
          <p className="text-4xl font-display font-bold text-white">
            {averageRating == null || reviewCount === 0 ? "—" : averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-slate-400 mt-1">Average Rating</p>
          <p className="text-xs text-slate-500">
            {reviewCount === 0
              ? "No reviews yet"
              : `${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="size-5" /> This Month
        </h4>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Jobs Completed</span>
            <span className="font-semibold text-white">{jobsCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Total Revenue</span>
            <span className="font-semibold text-emerald-400">
              {revenueEur == null ? "—" : `€${revenueEur.toLocaleString("de-DE")}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">On-Time Rate</span>
            <span className="font-semibold text-white">
              {onTimePct == null ? "—" : `${onTimePct}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Repeat Clients</span>
            <span className="font-semibold text-white">{num(repeatClients)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Figures update automatically as you complete jobs and clients leave reviews.
      </div>
    </div>
  );
}
