import { useState } from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ExtraSection, uid, useLocalState } from "./shared";
import { daysUntil } from "./WeatherDelayPredictor";

type ComplianceItem = {
  id: string;
  label: string;
  trade: string;
  renewsOn: string; // ISO date
  notes: string;
};

const SEED_COMPLIANCE: ComplianceItem[] = [
  {
    id: "c1",
    label: "Gas-Safe / TRGI certification",
    trade: "Heating & gas",
    renewsOn: "",
    notes: "Annual practical refresher recommended.",
  },
  {
    id: "c2",
    label: "DGUV V3 electrical safety inspection",
    trade: "Electrical",
    renewsOn: "",
    notes: "Required on all portable tools yearly.",
  },
  {
    id: "c3",
    label: "Asbestos awareness (TRGS 519)",
    trade: "Demolition / renovation",
    renewsOn: "",
    notes: "Re-test every 6 years.",
  },
];

export function ComplianceReminder() {
  const [items, setItems] = useLocalState<ComplianceItem[]>(
    "handyman.compliance.v1",
    SEED_COMPLIANCE,
  );
  const [draft, setDraft] = useState<ComplianceItem>({
    id: "",
    label: "",
    trade: "",
    renewsOn: "",
    notes: "",
  });

  function add() {
    if (!draft.label.trim()) return toast.error("Add the certification name.");
    setItems((arr) => [{ ...draft, id: uid() }, ...arr]);
    setDraft({ id: "", label: "", trade: "", renewsOn: "", notes: "" });
    toast.success("Compliance item added.");
  }

  return (
    <ExtraSection
      id="pro-compliance"
      icon={ShieldCheck}
      title="Compliance Reminder"
      subtitle="Track certifications and renewal dates for regulated trades — gas, electrical, asbestos, height work and more."
    >
      <ul className="space-y-2">
        {items.map((it) => {
          const d = daysUntil(it.renewsOn);
          let pill = { txt: "Set a date", cls: "bg-white/10 text-slate-300" };
          if (d !== null) {
            if (d < 0) pill = { txt: `Expired ${-d}d ago`, cls: "bg-rose-500/15 text-rose-300" };
            else if (d <= 30) pill = { txt: `Due in ${d}d`, cls: "bg-amber-500/15 text-amber-300" };
            else pill = { txt: `Due in ${d}d`, cls: "bg-emerald-500/15 text-emerald-300" };
          }
          return (
            <li
              key={it.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{it.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pill.cls}`}>
                    {pill.txt}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {it.trade || "General"}
                  {it.notes ? ` · ${it.notes}` : ""}
                </p>
              </div>
              <button
                onClick={() => setItems((arr) => arr.filter((x) => x.id !== it.id))}
                className="text-slate-400 hover:text-rose-300"
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] uppercase tracking-wider text-slate-400">Add a certification</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]">
          <Input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="e.g. Master Plumber license"
            className="intake-input h-10"
          />
          <Input
            value={draft.trade}
            onChange={(e) => setDraft((d) => ({ ...d, trade: e.target.value }))}
            placeholder="Trade / scope"
            className="intake-input h-10"
          />
          <Input
            type="date"
            value={draft.renewsOn}
            onChange={(e) => setDraft((d) => ({ ...d, renewsOn: e.target.value }))}
            className="intake-input h-10"
          />
          <Button
            type="button"
            onClick={add}
            className="btn-glow btn-glow-hover h-10 rounded-full px-3 text-xs"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <Input
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Notes (issuer, ref number, renewal steps)"
          className="intake-input mt-2 h-10"
        />
      </div>
    </ExtraSection>
  );
}
