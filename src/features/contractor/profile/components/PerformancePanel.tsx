/**
 * PerformancePanel — Private performance dashboard
 * Realistic metrics that help a handyman run and grow his business.
 */
import { TrendingUp, Clock, Users, Award, Target, Calendar } from "lucide-react";

export function PerformancePanel() {
  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="font-display text-lg font-bold text-white">My Performance</h3>
        <p className="text-slate-400 text-sm">June 2026 • Private view</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Clock className="mx-auto mb-3 size-8 text-orange" />
          <p className="text-4xl font-display font-bold text-white">1.4h</p>
          <p className="text-sm text-slate-400 mt-1">Avg. Response Time</p>
          <p className="text-xs text-emerald-400">Excellent</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Award className="mx-auto mb-3 size-8 text-orange" />
          <p className="text-4xl font-display font-bold text-white">4.9</p>
          <p className="text-sm text-slate-400 mt-1">Average Rating</p>
          <p className="text-xs text-emerald-400">47 reviews</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="size-5" /> This Month
        </h4>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Jobs Completed</span>
            <span className="font-semibold text-white">9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Total Revenue</span>
            <span className="font-semibold text-emerald-400">€16,840</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">On-Time Rate</span>
            <span className="font-semibold text-white">100%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Repeat Clients</span>
            <span className="font-semibold text-white">4</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h4 className="font-semibold text-white mb-3">Goal Progress</h4>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-2 bg-orange w-[68%] rounded-full"></div>
        </div>
        <p className="text-xs text-slate-400 mt-2">68% toward €25k monthly target</p>
      </div>

      <div className="text-center text-xs text-slate-500">
        Full analytics, graphs and goal setting coming soon
      </div>
    </div>
  );
}
