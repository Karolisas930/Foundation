/**
 * TradesSection — primary trade selector + Meister badge toggle.
 */
import { Hammer, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRADE_OPTIONS, REGULATED_TRADES, VOLUNTARY_MEISTER_TRADES } from "@/regions";
import { SectionShell } from "./SectionShell";

interface Props {
  editing: boolean;
  trade: string;
  setTrade: (v: string) => void;
  meister: boolean;
  setMeister: (v: boolean) => void;
  onDirty: () => void;
}

export function TradesSection({ editing, trade, setTrade, meister, setMeister, onDirty }: Props) {
  const meisterAllowed = REGULATED_TRADES.has(trade) || VOLUNTARY_MEISTER_TRADES.has(trade);
  return (
    <SectionShell
      id="section-trades"
      icon={Hammer}
      eyebrow="Step 2"
      title="Trades & Services"
      subtitle="Pick the craft you offer. Regulated trades unlock the Meister badge."
    >
      <div>
        <Label
          htmlFor="pfTrade"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Primary trade
        </Label>
        <Select
          value={trade}
          onValueChange={(v) => {
            setTrade(v);
            onDirty();
          }}
          disabled={!editing}
        >
          <SelectTrigger id="pfTrade" className="intake-input mt-2">
            <SelectValue placeholder="Select trade" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {TRADE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <ShieldCheck className="size-4 text-orange" /> Meister qualification
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {meisterAllowed
              ? "Display the Meister badge on your profile and quotes."
              : "Select a regulated trade above to enable the Meister badge."}
          </p>
        </div>
        <button
          type="button"
          disabled={!editing || !meisterAllowed}
          onClick={() => {
            setMeister(!meister);
            onDirty();
          }}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
            meister
              ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
              : "border-white/15 bg-white/5 text-slate-300 hover:border-orange/40 hover:text-orange"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {meister ? "Active" : "Enable"}
        </button>
      </div>
    </SectionShell>
  );
}
