/**
 * TeamPage — Staff overview. Thin orchestrator; heavy lifting lives in
 * ./team/ (TeamMembersList, InviteMemberDialog, EditMemberDialog, pills).
 */
import { useEffect, useMemo, useState } from "react";
import { Search, Shield, UserPlus, UsersRound } from "lucide-react";
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
import {
  EXTENDED_ROLES,
  loadTeam,
  removeMember,
  setMemberStatus,
  subscribeTeam,
  type ExtendedRole,
  type TeamMember,
} from "@/features/contractor/team/team-store";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  setImpersonatedMember,
  useTeamPermissions,
} from "@/features/contractor/team/hooks/useTeamPermissions";
import { MemberDetail } from "@/features/contractor/team/components/MemberDetail";
import { TeamStatsGrid } from "./team/TeamStats";
import { TeamMembersList } from "./team/TeamMembersList";
import { InviteMemberDialog } from "./team/InviteMemberDialog";
import { EditMemberDialog } from "./team/EditMemberDialog";
import { roleLabel } from "./team/TeamPills";

// Re-export public helpers that other modules (e.g. MemberDetail) rely on.
export { initials, roleLabel, RolePill, StatusPill } from "./team/TeamPills";

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(() => loadTeam());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TeamMember["status"]>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | ExtendedRole>("all");
  const { user } = useAuth();
  const perms = useTeamPermissions();
  const ownerId = user?.id && !user.id.startsWith("demo:") ? user.id : null;

  useEffect(() => {
    const unsub = subscribeTeam(() => setTeam(loadTeam()));
    return unsub;
  }, []);

  const selected = useMemo(() => team.find((m) => m.id === selectedId) ?? null, [team, selectedId]);
  const editing = useMemo(() => team.find((m) => m.id === editingId) ?? null, [team, editingId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (
        roleFilter !== "all" &&
        (m.title ?? (m.role === "Owner" ? "Owner" : "Journeyman")) !== roleFilter
      )
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        roleLabel(m).toLowerCase().includes(q)
      );
    });
  }, [team, query, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const mo = now.getMonth();
    const activeThisMonth = team.filter(
      (m) =>
        m.status === "active" &&
        m.timeLogs.some((l) => {
          const d = new Date(l.date);
          return d.getFullYear() === y && d.getMonth() === mo;
        }),
    ).length;
    const pending = team.filter((m) => m.status === "pending").length;
    return { total: team.length, activeThisMonth, pending };
  }, [team]);

  if (selected) {
    return (
      <MemberDetail
        member={selected}
        onBack={() => setSelectedId(null)}
        onEdit={() => setEditingId(selected.id)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-orange-300 ring-1 ring-inset ring-white/10">
            <UsersRound className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Team & Staff</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage crew, roles, and permissions. Owners see everything; staff access is scoped by
              permission group.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="shrink-0 rounded-full bg-orange-500 text-white hover:bg-orange-600"
        >
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite
        </Button>
      </div>

      <TeamStatsGrid
        total={stats.total}
        activeThisMonth={stats.activeThisMonth}
        pending={stats.pending}
      />

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {EXTENDED_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TeamMembersList
        members={filtered}
        onOpen={(m) => setSelectedId(m.id)}
        onEdit={(m) => setEditingId(m.id)}
        onToggleActive={(m) => {
          const next = m.status === "inactive" ? "active" : "inactive";
          setMemberStatus(m.id, next);
          toast.success(next === "inactive" ? "Member deactivated" : "Member reactivated");
        }}
        onRemove={(m) => {
          if (m.id === "owner") return;
          if (confirm(`Remove ${m.name}? For active staff, consider deactivating instead.`)) {
            removeMember(m.id);
            toast.success("Member removed");
          }
        }}
      />

      {perms.impersonating && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-100">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-300" />
            <span>Previewing workspace as {perms.memberName ?? "restricted staff"}.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setImpersonatedMember(null)}>
            Return to owner view
          </Button>
        </div>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} ownerId={ownerId} />

      {editing && (
        <EditMemberDialog
          member={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditingId(null)}
        />
      )}
    </div>
  );
}
