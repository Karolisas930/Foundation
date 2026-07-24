import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ExtraSection, uid, useLocalState } from "./shared";

type Helper = {
  id: string;
  name: string;
  trade: string;
  availability: "today" | "this-week" | "next-week";
  rate: number;
  rating: number;
  notes: string;
};

const SEED_HELPERS: Helper[] = [
  {
    id: "h1",
    name: "Lukas B.",
    trade: "Electrician helper",
    availability: "today",
    rate: 28,
    rating: 4.8,
    notes: "Own van, lives 5km away",
  },
  {
    id: "h2",
    name: "Marta K.",
    trade: "Tiler",
    availability: "this-week",
    rate: 35,
    rating: 4.6,
    notes: "Specializes in bathrooms",
  },
  {
    id: "h3",
    name: "Diego R.",
    trade: "General labourer",
    availability: "today",
    rate: 22,
    rating: 4.4,
    notes: "Reliable for demo days",
  },
  {
    id: "h4",
    name: "Anya P.",
    trade: "Painter",
    availability: "next-week",
    rate: 26,
    rating: 4.9,
    notes: "Detail-oriented, slow but clean",
  },
];

export function SubcontractorMatcher() {
  const [pool, setPool] = useLocalState<Helper[]>("handyman.helpers.v1", SEED_HELPERS);
  const [need, setNeed] = useState("");
  const [when, setWhen] = useState<"any" | Helper["availability"]>("any");
  const [draft, setDraft] = useState<Helper>({
    id: "",
    name: "",
    trade: "",
    availability: "this-week",
    rate: 25,
    rating: 4.5,
    notes: "",
  });

  const matches = useMemo(() => {
    const q = need.trim().toLowerCase();
    return pool
      .filter((h) => (when === "any" ? true : h.availability === when))
      .filter((h) => (q ? `${h.trade} ${h.notes} ${h.name}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.rating - a.rating);
  }, [pool, need, when]);

  function add() {
    if (!draft.name.trim() || !draft.trade.trim())
      return toast.error("Name and trade are required.");
    setPool((arr) => [{ ...draft, id: uid() }, ...arr]);
    setDraft({
      id: "",
      name: "",
      trade: "",
      availability: "this-week",
      rate: 25,
      rating: 4.5,
      notes: "",
    });
    toast.success("Helper added to your bench.");
  }

  return (
    <ExtraSection
      id="pro-helper-matcher"
      icon={Users}
      title="Subcontractor & Helper Matcher"
      subtitle="Keep a private bench of helpers and find the right one by trade and availability."
    >
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Input
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="What do you need? e.g. tiler, demo, painter…"
          className="intake-input h-10"
        />
        <Select value={when} onValueChange={(v) => setWhen(v as typeof when)}>
          <SelectTrigger className="intake-input h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any availability</SelectItem>
            <SelectItem value="today">Available today</SelectItem>
            <SelectItem value="this-week">This week</SelectItem>
            <SelectItem value="next-week">Next week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ul className="mt-3 space-y-2">
        {matches.length === 0 && (
          <li className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
            No matches. Try a wider availability window or add new helpers below.
          </li>
        )}
        {matches.map((h) => (
          <li key={h.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-white">
                {h.name}{" "}
                <span className="ml-1 text-[11px] font-normal text-slate-400">· {h.trade}</span>
              </p>
              <span className="text-[11px] text-orange">
                ★ {h.rating.toFixed(1)} · €{h.rate}/h
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {h.availability === "today"
                ? "Available today"
                : h.availability === "this-week"
                  ? "This week"
                  : "Next week"}
              {h.notes ? ` · ${h.notes}` : ""}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] uppercase tracking-wider text-slate-400">Add to your bench</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_0.8fr_0.6fr_auto]">
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Name"
            className="intake-input h-10"
          />
          <Input
            value={draft.trade}
            onChange={(e) => setDraft((d) => ({ ...d, trade: e.target.value }))}
            placeholder="Trade / specialty"
            className="intake-input h-10"
          />
          <Select
            value={draft.availability}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, availability: v as Helper["availability"] }))
            }
          >
            <SelectTrigger className="intake-input h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This week</SelectItem>
              <SelectItem value="next-week">Next week</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={draft.rate}
            onChange={(e) => setDraft((d) => ({ ...d, rate: Number(e.target.value) || 0 }))}
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
          placeholder="Notes (van, languages, strengths)"
          className="intake-input mt-2 h-10"
        />
      </div>
    </ExtraSection>
  );
}
