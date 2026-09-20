import { useMemo, useState } from "react";
import { Plus, User as UserIcon, UserPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCrewMap, useCrewMutations } from "./use-job-crew";

export function CrewTile({ jobId }: { jobId: string }) {
  const crewMap = useCrewMap();
  const { addMember, removeMember } = useCrewMutations();
  const crew = crewMap[jobId] ?? [];

  // People already assigned to any of my other jobs — a real, data-driven
  // suggestion list instead of the old hardcoded demo pool.
  const suggestions = useMemo(() => {
    const all = new Set<string>();
    for (const [id, names] of Object.entries(crewMap)) {
      if (id === jobId) continue;
      names.forEach((n) => all.add(n));
    }
    return [...all].filter((n) => !crew.includes(n)).sort();
  }, [crewMap, jobId, crew]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [newName, setNewName] = useState("");

  function add(name: string) {
    const n = name.trim();
    if (!n) return;
    if (crew.some((c) => c.toLowerCase() === n.toLowerCase())) {
      toast(`${n} is already on this job`, { duration: 1500 });
      return;
    }
    addMember.mutate(
      { bookingId: jobId, name: n },
      {
        onSuccess: () => toast.success(`${n} added to crew`, { duration: 1800 }),
        onError: (err: Error) => toast.error("Could not add", { description: err.message }),
      },
    );
    setNewName("");
    setPickerOpen(false);
  }

  function remove(name: string) {
    removeMember.mutate(
      { bookingId: jobId, name },
      {
        onSuccess: () => toast(`${name} removed`, { duration: 1500 }),
        onError: (err: Error) => toast.error("Could not remove", { description: err.message }),
      },
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crew</p>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-orange/50 bg-orange/10 px-2.5 py-1 text-[11px] font-bold text-orange-glow hover:bg-orange/20"
            >
              <UserPlus className="size-3.5" />
              Add
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 border-white/10 bg-[#0f172a] p-3 text-slate-100"
          >
            {suggestions.length > 0 && (
              <>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  From your other jobs
                </p>
                <div className="mb-3 flex flex-col gap-1">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => add(name)}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-100 hover:bg-white/10"
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserIcon className="size-3.5 text-slate-400" />
                        {name}
                      </span>
                      <Plus className="size-3.5 text-orange-glow" />
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className={suggestions.length > 0 ? "border-t border-white/10 pt-2" : ""}>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Add team member
              </Label>
              <div className="mt-1 flex gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") add(newName);
                  }}
                  placeholder="Name or email"
                  className="h-9 border-white/10 bg-white/[0.04] text-xs text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={addMember.isPending}
                  onClick={() => add(newName)}
                  className="h-9 bg-orange text-slate-900 hover:bg-orange-glow"
                >
                  Add
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {crew.length === 0 ? (
        <p className="text-sm text-slate-400">
          No one assigned yet — add a team member to get started.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {crew.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-100"
            >
              <UserIcon className="size-3 text-slate-400" />
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                aria-label={`Remove ${name}`}
                className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
