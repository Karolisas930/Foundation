import { CheckCircle2, Clock } from "lucide-react";

export function StatusBadge({ status }: { status: "pending" | "verified" | "missing" }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
        Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
        <Clock className="h-3 w-3" strokeWidth={2} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
      Missing
    </span>
  );
}
