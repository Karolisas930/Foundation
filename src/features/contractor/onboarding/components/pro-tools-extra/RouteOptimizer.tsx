import { useMemo, useState } from "react";
import { MapPin, Plus, Route as RouteIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ExtraSection, uid, useLocalState } from "./shared";

type Stop = { id: string; address: string; window: string; minutes: number; needs: string };

export function RouteOptimizer() {
  const [stops, setStops] = useLocalState<Stop[]>("handyman.routeOptimizer.v1", []);
  const [draft, setDraft] = useState<Stop>({
    id: "",
    address: "",
    window: "",
    minutes: 60,
    needs: "",
  });
  const [weather, setWeather] = useState<"clear" | "rain" | "snow">("clear");

  function add() {
    if (!draft.address.trim()) return toast.error("Add an address.");
    setStops((s) => [...s, { ...draft, id: uid() }]);
    setDraft({ id: "", address: "", window: "", minutes: 60, needs: "" });
  }

  const optimized = useMemo(() => {
    // Lightweight heuristic: respect time windows then shortest visit time.
    const sorted = [...stops].sort((a, b) => {
      const wa = a.window || "23:59";
      const wb = b.window || "23:59";
      if (wa !== wb) return wa.localeCompare(wb);
      return a.minutes - b.minutes;
    });
    const buffer = weather === "clear" ? 0 : weather === "rain" ? 10 : 20;
    let cursor = 8 * 60; // 08:00 in minutes
    return sorted.map((s) => {
      const start = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      cursor += s.minutes + 15 + buffer; // visit + travel + weather buffer
      return { ...s, eta: start };
    });
  }, [stops, weather]);

  return (
    <ExtraSection
      id="pro-route-optimizer"
      icon={RouteIcon}
      title="Smart Daily Route Optimizer"
      subtitle="Add today's stops with time windows. We sequence them and pad travel time for traffic, weather and material pickups."
    >
      <div className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_0.6fr_1fr_auto]">
        <Input
          value={draft.address}
          onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
          placeholder="Address or job site"
          className="intake-input h-10"
        />
        <Input
          value={draft.window}
          onChange={(e) => setDraft((d) => ({ ...d, window: e.target.value }))}
          placeholder="Window e.g. 10:00"
          className="intake-input h-10"
        />
        <Input
          type="number"
          value={draft.minutes}
          onChange={(e) => setDraft((d) => ({ ...d, minutes: Number(e.target.value) || 0 }))}
          className="intake-input h-10"
        />
        <Input
          value={draft.needs}
          onChange={(e) => setDraft((d) => ({ ...d, needs: e.target.value }))}
          placeholder="Materials / tools needed"
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
      <div className="mt-3 flex items-center gap-3">
        <Label className="text-[11px] uppercase tracking-wider text-slate-400">
          Today's weather
        </Label>
        <Select value={weather} onValueChange={(v) => setWeather(v as typeof weather)}>
          <SelectTrigger className="intake-input h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">Clear / dry</SelectItem>
            <SelectItem value="rain">Rain (+10 min)</SelectItem>
            <SelectItem value="snow">Snow / ice (+20 min)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {optimized.length === 0 ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
          No stops yet. Add at least two to see an optimized order.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {optimized.map((s, i) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange/15 text-xs font-bold text-orange">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{s.address}</p>
                  <span className="text-[11px] text-orange">ETA {s.eta}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <MapPin className="mr-1 inline size-3" />
                  {s.window ? `Window ${s.window} · ` : ""}
                  {s.minutes} min on site
                  {s.needs ? ` · ${s.needs}` : ""}
                </p>
              </div>
              <button
                onClick={() => setStops((arr) => arr.filter((x) => x.id !== s.id))}
                className="text-slate-400 hover:text-rose-300"
                aria-label="Remove stop"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </ExtraSection>
  );
}
