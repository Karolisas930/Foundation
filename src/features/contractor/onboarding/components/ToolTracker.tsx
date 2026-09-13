import { useRef, useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProSection } from "./HandymanProSection";

type Tool = {
  id: string;
  name: string;
  photo: string | null;
  lastService: string;
  intervalDays: number;
};

export function ToolTracker() {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: "tl1",
      name: "Bosch GSR drill",
      photo: null,
      lastService: "2026-03-12",
      intervalDays: 180,
    },
    { id: "tl2", name: "Tile saw", photo: null, lastService: "2026-01-04", intervalDays: 120 },
  ]);
  const [name, setName] = useState("");
  const [interval, setInterval] = useState(180);
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function nextDue(t: Tool) {
    const next = new Date(t.lastService);
    next.setDate(next.getDate() + t.intervalDays);
    const days = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { date: next.toISOString().slice(0, 10), days };
  }

  function add() {
    if (!name.trim()) return;
    setTools((c) => [
      ...c,
      {
        id: `tl-${Date.now()}`,
        name: name.trim(),
        photo: null,
        lastService: new Date().toISOString().slice(0, 10),
        intervalDays: interval,
      },
    ]);
    setName("");
  }
  async function setPhoto(id: string, file?: File | null) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () =>
      setTools((c) => c.map((t) => (t.id === id ? { ...t, photo: String(r.result) } : t)));
    r.readAsDataURL(file);
  }

  return (
    <ProSection
      id="pro-tools"
      icon={Wrench}
      title="Tool & Equipment Tracker"
      subtitle="Track your kit and get a reminder when maintenance is due."
      badge={
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
          {tools.length} item{tools.length === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
        <Input
          id="tool-name"
          name="tool-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tool name (e.g. Festool sander)"
          className="intake-input h-10"
        />
        <Input
          id="tool-interval"
          name="tool-interval"
          type="number"
          min={7}
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value) || 180)}
          placeholder="Days"
          className="intake-input h-10"
          aria-label="Service interval in days"
        />
        <Button
          type="button"
          onClick={add}
          className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
        >
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {tools.map((t) => {
          const due = nextDue(t);
          const status =
            due.days < 0
              ? { label: "Overdue", cls: "bg-red-500/20 text-red-300" }
              : due.days <= 14
                ? { label: `${due.days}d`, cls: "bg-amber-400/20 text-amber-300" }
                : { label: `${due.days}d`, cls: "bg-emerald-400/15 text-emerald-300" };
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"
            >
              <button
                type="button"
                onClick={() => photoRefs.current[t.id]?.click()}
                className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-800 text-slate-400 hover:text-orange"
                aria-label="Add photo"
              >
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <Wrench className="size-4" />
                )}
              </button>
              <input
                ref={(el) => {
                  photoRefs.current[t.id] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(t.id, e.target.files?.[0])}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                <p className="text-[11px] text-slate-400">
                  Serviced {t.lastService} · every {t.intervalDays}d → due {due.date}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.cls}`}
              >
                {status.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  setTools((c) =>
                    c.map((x) =>
                      x.id === t.id
                        ? { ...x, lastService: new Date().toISOString().slice(0, 10) }
                        : x,
                    ),
                  )
                }
                className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange hover:bg-orange/10"
              >
                Serviced
              </button>
              <button
                type="button"
                onClick={() => setTools((c) => c.filter((x) => x.id !== t.id))}
                className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/5 hover:text-orange"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ProSection>
  );
}
