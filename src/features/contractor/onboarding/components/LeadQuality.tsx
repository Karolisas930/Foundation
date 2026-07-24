import { useState } from "react";
import { Flame, ThermometerSnowflake, ThermometerSun } from "lucide-react";

import { ProSection } from "./HandymanProSection";

type Lead = {
  id: string;
  client: string;
  trade: string;
  budget: number;
  description: string;
  urgency: "Urgent" | "This week" | "Flexible";
  verified: boolean;
};

function scoreLead(l: Lead): {
  score: number;
  label: "Hot" | "Warm" | "Cold";
  cls: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  let s = 0;
  if (l.budget >= 2000) s += 3;
  else if (l.budget >= 500) s += 2;
  else s += 1;
  s += l.urgency === "Urgent" ? 3 : l.urgency === "This week" ? 2 : 1;
  if (l.verified) s += 2;
  if (l.description.length > 80) s += 1;
  if (s >= 8) return { score: s, label: "Hot", cls: "bg-red-500/20 text-red-300", icon: Flame };
  if (s >= 5)
    return { score: s, label: "Warm", cls: "bg-amber-400/20 text-amber-300", icon: ThermometerSun };
  return { score: s, label: "Cold", cls: "bg-sky-400/20 text-sky-300", icon: ThermometerSnowflake };
}

export function LeadQuality() {
  const [leads] = useState<Lead[]>([
    {
      id: "l1",
      client: "Familie Berger",
      trade: "Bathroom retile",
      budget: 4200,
      description:
        "Complete retile of 8 m² bathroom incl. demolition and new drain. Need quote by Friday.",
      urgency: "Urgent",
      verified: true,
    },
    {
      id: "l2",
      client: "Mira Kovač",
      trade: "Paint apartment",
      budget: 800,
      description: "2 rooms, white walls.",
      urgency: "This week",
      verified: true,
    },
    {
      id: "l3",
      client: "Anonymous",
      trade: "General repair",
      budget: 0,
      description: "Some stuff broken.",
      urgency: "Flexible",
      verified: false,
    },
  ]);

  return (
    <ProSection
      id="pro-leads"
      icon={Flame}
      title="Lead Quality"
      subtitle="Simple signals (budget, urgency, profile verified, brief detail) help you focus on the best leads."
    >
      <div className="space-y-2">
        {leads.map((l) => {
          const q = scoreLead(l);
          const Icon = q.icon;
          return (
            <div
              key={l.id}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${q.cls}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{l.client}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${q.cls}`}
                  >
                    {q.label} · {q.score}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {l.trade} · {l.urgency} · {l.verified ? "verified" : "unverified"} ·{" "}
                  {l.budget ? `€${l.budget.toLocaleString()}` : "no budget set"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{l.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ProSection>
  );
}
