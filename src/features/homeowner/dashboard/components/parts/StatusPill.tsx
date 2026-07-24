import { Sparkles } from "lucide-react";
import type { EcosystemProject } from "@/core/demo-session";

export function StatusPill({
  status,
  children,
}: {
  status: EcosystemProject["status"];
  children: React.ReactNode;
}) {
  const tone =
    status === "awarded"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
      : status === "clarifying"
        ? "bg-sky-500/15 text-sky-300 border-sky-400/30"
        : status === "completed"
          ? "bg-slate-500/15 text-slate-300 border-slate-400/30"
          : "bg-orange/15 text-orange border-orange/40";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      <Sparkles className="size-3" /> {children}
    </span>
  );
}
