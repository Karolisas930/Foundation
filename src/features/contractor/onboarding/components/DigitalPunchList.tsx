import { useRef, useState } from "react";
import { CheckCircle2, Circle, ClipboardList, Copy, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ProSection } from "./HandymanProSection";

type PunchItem = { id: string; text: string; done: boolean; photo: string | null };

export function DigitalPunchList() {
  const [items, setItems] = useState<PunchItem[]>([
    { id: "p1", text: "Demo old tiles in bathroom", done: true, photo: null },
    { id: "p2", text: "Install new shower drain", done: false, photo: null },
    { id: "p3", text: "Re-grout floor & walls", done: false, photo: null },
  ]);
  const [draft, setDraft] = useState("");
  const [clientApproved, setClientApproved] = useState(false);
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const progress = Math.round(
    (items.filter((i) => i.done).length / Math.max(items.length, 1)) * 100,
  );

  function add() {
    const t = draft.trim();
    if (!t) return;
    setItems((c) => [...c, { id: `p-${Date.now()}`, text: t, done: false, photo: null }]);
    setDraft("");
  }
  function toggle(id: string) {
    setItems((c) => c.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function remove(id: string) {
    setItems((c) => c.filter((i) => i.id !== id));
  }
  async function setPhoto(id: string, file?: File | null) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () =>
      setItems((c) =>
        c.map((i) => (i.id === id ? { ...i, photo: String(r.result), done: true } : i)),
      );
    r.readAsDataURL(file);
  }
  function share() {
    const text =
      `Punch list (${progress}% complete)\n\n` +
      items.map((i) => `${i.done ? "✓" : "•"} ${i.text}`).join("\n");
    if (navigator.share) {
      navigator.share({ title: "Punch List", text }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Punch list copied — paste into chat or email.");
    }
  }

  return (
    <ProSection
      id="pro-punch-list"
      icon={ClipboardList}
      title="Digital Punch List"
      subtitle="Shareable checklist with photo proof and a one-tap client approval."
      badge={
        <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-300">
          {progress}% done
        </span>
      }
    >
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a checklist item…"
          className="intake-input h-10"
        />
        <Button
          type="button"
          onClick={add}
          className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
        >
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"
          >
            <button type="button" onClick={() => toggle(i.id)} className="shrink-0 text-orange">
              {i.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
            </button>
            <span
              className={`flex-1 text-sm ${i.done ? "text-slate-400 line-through" : "text-white"}`}
            >
              {i.text}
            </span>
            {i.photo ? (
              <img src={i.photo} alt="proof" className="size-10 shrink-0 rounded-md object-cover" />
            ) : (
              <button
                type="button"
                onClick={() => photoRefs.current[i.id]?.click()}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 hover:border-orange/50 hover:text-orange"
                aria-label="Add proof photo"
              >
                <Upload className="size-3.5" />
              </button>
            )}
            <input
              ref={(el) => {
                photoRefs.current[i.id] = el;
              }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(i.id, e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => remove(i.id)}
              className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/5 hover:text-orange"
              aria-label="Delete"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={clientApproved}
            onCheckedChange={(v) => {
              setClientApproved(v);
              if (v) toast.success("Client approval recorded.");
            }}
          />
          <span className="text-sm text-white">Client signed off on completion</span>
        </div>
        <Button
          type="button"
          onClick={share}
          variant="outline"
          className="h-9 rounded-full border-white/15 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
        >
          <Copy className="mr-1.5 size-3.5" /> Share / copy
        </Button>
      </div>
    </ProSection>
  );
}
