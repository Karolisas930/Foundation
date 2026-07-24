/**
 * TeamManagement — Clean, professional team roster + invite dialog.
 * Improved: better layout, consistent theming, improved accessibility.
 */
import { useState } from "react";
import { Clock, Loader2, Mail, MapPin, Plus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLocation } from "@/features/contractor/timesheets/hooks/useLocation";
import { appendStaffGpsPing } from "@/features/contractor/timesheets/hooks/useStaffGpsLog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials, type TeamMember } from "./profile-types";

interface TeamTotal {
  member: TeamMember;
  km: number;
  expenses: number;
}

interface TeamManagementProps {
  teamMembers: TeamMember[];
  teamTotals: TeamTotal[];
  teamTotalKm: number;
  teamTotalExpenses: number;
  onOpenInvite: () => void;
  onRemoveMember: (id: string) => void;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  onSendInvite: () => void;
}

export function TeamManagement({
  teamMembers,
  teamTotals,
  teamTotalKm,
  teamTotalExpenses,
  onOpenInvite,
  onRemoveMember,
  inviteOpen,
  setInviteOpen,
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  onSendInvite,
}: TeamManagementProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [hoursDraft, setHoursDraft] = useState({
    memberId: teamMembers[0]?.id ?? "me",
    workDate: today,
    hours: "",
    notes: "",
  });
  const [savingHours, setSavingHours] = useState(false);
  const { fix: gpsFix } = useLocation(true);

  async function logStaffHours() {
    if (!user?.id) {
      toast.error("Sign in to log staff hours.");
      return;
    }
    const parsed = Number(hoursDraft.hours.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 24) {
      toast.error("Enter hours between 0.01 and 24.00.");
      return;
    }
    const member = teamMembers.find((m) => m.id === hoursDraft.memberId);
    setSavingHours(true);
    const { error } = await supabase.from("staff_hours").insert({
      owner_id: user.id,
      member_id: hoursDraft.memberId,
      member_name: member?.name ?? null,
      work_date: hoursDraft.workDate,
      hours: Math.round(parsed * 100) / 100,
      notes: hoursDraft.notes.trim() || null,
      // Phase 5 — GPS trail: persist the fix on the row when we have one.
      // Columns exist in the staged Phase 1 SQL; Supabase silently ignores
      // unknown keys locally when the migration hasn't been applied yet.
      location_lat: gpsFix?.latitude ?? null,
      location_lng: gpsFix?.longitude ?? null,
      location_accuracy_m: gpsFix?.accuracy ?? null,
    });
    setSavingHours(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Persist the fix into the staff GPS log (RLS-scoped to the owner).
    if (gpsFix) {
      void appendStaffGpsPing(user.id, {
        member_id: hoursDraft.memberId,
        member_name: member?.name ?? null,
        job: hoursDraft.notes.trim() || null,
        latitude: gpsFix.latitude,
        longitude: gpsFix.longitude,
        accuracy: gpsFix.accuracy,
        timestamp: gpsFix.timestamp,
      });
    }
    toast.success(
      `Logged ${parsed.toFixed(2)}h for ${member?.name ?? "team"}${gpsFix ? " · GPS pinned" : ""}.`,
    );
    setHoursDraft((d) => ({ ...d, hours: "", notes: "" }));
  }

  return (
    <>
      <section className="mx-2 mt-6 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
            <Users className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-white">Team</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">
                  {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-bold text-emerald-300">
                  €{teamTotalExpenses.toFixed(2)} total expenses
                </span>
                <span className="rounded-full bg-sky-400/15 px-2 py-0.5 font-bold text-sky-300">
                  {teamTotalKm} km logged
                </span>
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Everyone on your crew can log mileage, receipts and material costs in one shared
              place.
            </p>

            <Button
              type="button"
              onClick={onOpenInvite}
              className="mt-4 btn-glow btn-glow-hover h-9 rounded-full px-4 text-xs"
            >
              <UserPlus className="mr-1.5 size-4" />
              Invite colleague
            </Button>

            {/* Staff working hours entry */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="size-4 text-orange" />
                <h4 className="text-sm font-bold text-white">Log staff working hours</h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_130px_110px_auto]">
                <Select
                  value={hoursDraft.memberId}
                  onValueChange={(v) => setHoursDraft((d) => ({ ...d, memberId: v }))}
                >
                  <SelectTrigger className="intake-input h-10">
                    <SelectValue placeholder="Team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={hoursDraft.workDate}
                  onChange={(e) => setHoursDraft((d) => ({ ...d, workDate: e.target.value }))}
                  className="intake-input h-10"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={24}
                  placeholder="Hours"
                  value={hoursDraft.hours}
                  onChange={(e) => setHoursDraft((d) => ({ ...d, hours: e.target.value }))}
                  className="intake-input h-10"
                  aria-label="Hours worked"
                />
                <Button
                  type="button"
                  onClick={logStaffHours}
                  disabled={savingHours}
                  className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
                >
                  {savingHours ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1 size-4" />
                  )}
                  Log hours
                </Button>
              </div>
              <Input
                placeholder="Notes (optional) — job, site, task"
                value={hoursDraft.notes}
                onChange={(e) => setHoursDraft((d) => ({ ...d, notes: e.target.value }))}
                className="intake-input mt-2 h-10"
              />
              <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                Two-decimal precision · saved securely to staff_hours (row-level scoped to you)
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {teamTotals.map(({ member, km, expenses }) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.05]"
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${member.color}`}
                  >
                    {initials(member.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-white">{member.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          member.role === "Owner"
                            ? "bg-orange/15 text-orange"
                            : member.role === "Pending"
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">{member.email}</p>
                  </div>

                  <div className="hidden text-right text-sm sm:block">
                    <p className="font-display font-extrabold text-white">{km} km</p>
                    <p className="text-[10px] text-slate-400">mileage</p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-display font-extrabold text-emerald-300">
                      €{expenses.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">expenses</p>
                  </div>

                  {member.id !== "me" && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Remove member"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-white/10 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-orange" />
              Invite a colleague
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              They’ll get an email invite and can start logging mileage, receipts and materials with
              your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="invite-name">Name (optional)</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Anna Schmidt"
                className="intake-input mt-1"
              />
            </div>

            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="intake-input mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSendInvite} className="btn-glow">
              <Mail className="mr-2 size-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
