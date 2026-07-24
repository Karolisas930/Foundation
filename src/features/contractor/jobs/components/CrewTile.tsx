import { useState } from "react";
import { Plus, User as UserIcon, UserPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { STAFF_POOL, addCrewMember, removeCrewMember, useCrewOverride } from "./active-jobs-store";

export function CrewTile({ jobId, defaultCrew }: { jobId: string; defaultCrew: string[] }) {
  const override = useCrewOverride(jobId);
  const crew = override ?? defaultCrew;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const available = STAFF_POOL.filter((n) => !crew.includes(n));

  function add(name: string) {
    addCrewMember(jobId, name, defaultCrew);
    toast.success(`${name} added to crew`, { duration: 1800 });
    setPickerOpen(false);
  }
  function remove(name: string) {
    removeCrewMember(jobId, name, defaultCrew);
    toast(`${name} removed`, { duration: 1500 });
  }
  function invite() {
    const e = inviteEmail.trim();
    if (!e) return;
    addCrewMember(jobId, e.split("@")[0], defaultCrew);
    toast.success("Invite sent", {
      description: `We'll email ${e} to join the crew.`,
      duration: 2500,
    });
    setInviteEmail("");
    setPickerOpen(false);
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
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Assign team member
            </p>
            <div className="mb-3 flex flex-col gap-1">
              {available.length === 0 && (
                <p className="text-xs text-slate-500">
                  Everyone from your team is already on this job.
                </p>
              )}
              {available.map((name) => (
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
            <div className="border-t border-white/10 pt-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Invite new staff
              </Label>
              <div className="mt-1 flex gap-1">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-9 border-white/10 bg-white/[0.04] text-xs text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={invite}
                  className="h-9 bg-orange text-slate-900 hover:bg-orange-glow"
                >
                  Invite
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
