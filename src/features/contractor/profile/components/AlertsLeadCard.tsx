import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Lead } from "./alerts-types";

export function AlertsLeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { Icon } = lead;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl text-left",
        "border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm",
        "p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-16px_rgba(0,0,0,0.6)]",
        "transition hover:border-white/[0.12] hover:bg-white/[0.05]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-glow/40",
        "active:scale-[0.995]",
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
            "bg-gradient-to-br ring-1 ring-inset",
            lead.iconTone,
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[15px] font-bold leading-tight text-white">
              {lead.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums",
                "bg-orange-glow/15 text-orange-glow ring-1 ring-inset ring-orange-glow/25",
              )}
            >
              €{lead.budgetEur}
            </span>
          </div>

          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            <span aria-hidden>📍</span> {lead.location}
            <span className="mx-1.5 opacity-50">•</span>
            {lead.postedAgo}
          </p>

          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-slate-300/90">
            {lead.snippet}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Est. Budget
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold",
                "text-orange-glow group-hover:bg-orange-glow/10 transition",
              )}
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
