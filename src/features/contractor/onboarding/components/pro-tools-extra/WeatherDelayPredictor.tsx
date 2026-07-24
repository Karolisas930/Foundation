import { useState } from "react";
import { CloudRain, CloudSun, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ExtraSection, uid, useLocalState } from "./shared";

type ActiveJob = {
  id: string;
  name: string;
  outdoor: boolean;
  windSensitive: boolean;
  daysLeft: number;
};

export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

export function WeatherDelayPredictor() {
  const [jobs, setJobs] = useLocalState<ActiveJob[]>("handyman.activeJobs.v1", []);
  const [draft, setDraft] = useState<ActiveJob>({
    id: "",
    name: "",
    outdoor: true,
    windSensitive: false,
    daysLeft: 3,
  });
  const [forecast, setForecast] = useState<"clear" | "rain" | "storm" | "frost">("rain");

  function add() {
    if (!draft.name.trim()) return toast.error("Name the job.");
    setJobs((arr) => [...arr, { ...draft, id: uid() }]);
    setDraft({ id: "", name: "", outdoor: true, windSensitive: false, daysLeft: 3 });
  }

  function risk(j: ActiveJob): { label: string; cls: string; advice: string } {
    if (!j.outdoor)
      return {
        label: "Low",
        cls: "bg-emerald-500/15 text-emerald-300",
        advice: "Indoor work — proceed as planned.",
      };
    if (forecast === "clear")
      return {
        label: "Low",
        cls: "bg-emerald-500/15 text-emerald-300",
        advice: "Conditions look fine, no buffer needed.",
      };
    if (forecast === "rain")
      return {
        label: "Medium",
        cls: "bg-amber-500/15 text-amber-300",
        advice: "Add a half-day buffer; cover exposed materials tonight.",
      };
    if (forecast === "storm" && j.windSensitive)
      return {
        label: "High",
        cls: "bg-rose-500/15 text-rose-300",
        advice: "Pause aerial / roof work and notify the client today.",
      };
    if (forecast === "storm")
      return {
        label: "High",
        cls: "bg-rose-500/15 text-rose-300",
        advice: "Expect 1-2 day slip. Pre-warn the client.",
      };
    return {
      label: "High",
      cls: "bg-rose-500/15 text-rose-300",
      advice: "Frost risk — protect any wet trades (paint, screed, mortar).",
    };
  }

  return (
    <ExtraSection
      id="pro-weather-delay"
      icon={CloudRain}
      title="Weather & Delay Predictor"
      subtitle="Flag active jobs at risk from the forecast and get a heads-up message to send to clients."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-[11px] uppercase tracking-wider text-slate-400">
          Forecast next 48h
        </Label>
        <Select value={forecast} onValueChange={(v) => setForecast(v as typeof forecast)}>
          <SelectTrigger className="intake-input h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">Clear / dry</SelectItem>
            <SelectItem value="rain">Rain</SelectItem>
            <SelectItem value="storm">Storm / high winds</SelectItem>
            <SelectItem value="frost">Frost / ice</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-slate-500">
          <CloudSun className="mr-1 inline size-3" />
          Wire to a real weather API later — same UI.
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {jobs.length === 0 && (
          <li className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
            Add an active job below to start tracking weather risk.
          </li>
        )}
        {jobs.map((j) => {
          const r = risk(j);
          return (
            <li
              key={j.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{j.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.cls}`}>
                    {r.label} risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {j.outdoor ? "Outdoor" : "Indoor"}
                  {j.windSensitive ? " · wind-sensitive" : ""}
                  {" · "}
                  {j.daysLeft} day{j.daysLeft === 1 ? "" : "s"} left
                </p>
                <p className="mt-1 text-xs text-slate-300">{r.advice}</p>
              </div>
              <button
                onClick={() => setJobs((arr) => arr.filter((x) => x.id !== j.id))}
                className="text-slate-400 hover:text-rose-300"
                aria-label="Remove job"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-2 sm:grid-cols-[2fr_0.7fr_0.7fr_0.6fr_auto]">
        <Input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Job name e.g. Roof repair Schmidt"
          className="intake-input h-10"
        />
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-200">
          Outdoor{" "}
          <Switch
            checked={draft.outdoor}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, outdoor: v }))}
          />
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-200">
          Wind{" "}
          <Switch
            checked={draft.windSensitive}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, windSensitive: v }))}
          />
        </label>
        <Input
          type="number"
          value={draft.daysLeft}
          onChange={(e) => setDraft((d) => ({ ...d, daysLeft: Number(e.target.value) || 0 }))}
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
    </ExtraSection>
  );
}
