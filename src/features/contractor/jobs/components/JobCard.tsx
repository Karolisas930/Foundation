import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Receipt,
  Timer,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";
import { UrgencyDot, QuickBtn } from "./atoms";
import { statusMeta, type Derived } from "./active-jobs-store";

export function JobCard({
  job,
  d,
  progress,
  onOpenDetail,
  onOpenDiary,
  onLogHours,
  onAddReceipt,
  onComplete,
}: {
  job: EcosystemProject;
  d: Derived;
  progress: number;
  onOpenDetail: () => void;
  onOpenDiary: () => void;
  onLogHours: () => void;
  onAddReceipt: () => void;
  onComplete: () => void;
}) {
  const meta = statusMeta(job);
  return (
    <div
      className={`group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border p-4 text-left shadow-xl backdrop-blur-sm transition sm:p-5 ${
        d.isOverdue
          ? "border-rose-400/40 bg-rose-500/[0.08] hover:border-rose-300/60"
          : d.isToday
            ? "border-orange/40 bg-orange/[0.06] hover:border-orange/60"
            : "border-white/10 bg-white/[0.04] hover:border-orange/40 hover:bg-white/[0.07]"
      }`}
    >
      {d.isOverdue && <span className="absolute inset-y-0 left-0 w-1 bg-rose-400" />}
      <button type="button" onClick={onOpenDetail} className="flex flex-col gap-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-base font-bold text-white sm:text-lg">
                {job.title}
              </p>
              <UrgencyDot urgency={d.urgency} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <UserIcon className="size-3.5" />
                {job.seekerId ? `Client · ${job.seekerId.slice(0, 6)}` : "Homeowner"}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {job.city ?? job.locationZip}
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  d.isOverdue ? "text-rose-300" : d.isToday ? "text-orange-glow" : "text-slate-300"
                }`}
              >
                <Clock className="size-3.5" />
                {d.scheduledLabel}
              </span>
              {d.staff.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" />
                  {d.staff.join(", ")}
                </span>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}
          >
            {meta.label}
          </span>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Progress</span>
            <span className="font-semibold text-slate-200">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] ${
                d.isOverdue
                  ? "bg-gradient-to-r from-rose-400 to-rose-300"
                  : "bg-gradient-to-r from-orange to-orange-glow"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      <div className="flex flex-wrap gap-2 pt-1">
        <QuickBtn
          onClick={onOpenDiary}
          icon={<BookOpen className="size-3.5" />}
          label="Site Diary"
          primary
        />
        <QuickBtn onClick={onLogHours} icon={<Timer className="size-3.5" />} label="Log Hours" />
        <QuickBtn onClick={onAddReceipt} icon={<Receipt className="size-3.5" />} label="Receipt" />
        <a
          href={`tel:${d.phone.replace(/\s+/g, "")}`}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="size-3.5" />
          Call
        </a>
        <QuickBtn
          onClick={onComplete}
          icon={<CheckCircle2 className="size-3.5" />}
          label="Complete"
        />
        <button
          type="button"
          onClick={onOpenDetail}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
        >
          Details
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
