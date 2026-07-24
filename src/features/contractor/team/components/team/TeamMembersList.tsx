import { Clock, Pencil, Power, Trash2 } from "lucide-react";
import { hoursThisMonth, type TeamMember } from "@/features/contractor/team/team-store";
import { RolePill, StatusPill, initials } from "./TeamPills";

export function TeamMembersList({
  members,
  onOpen,
  onEdit,
  onToggleActive,
  onRemove,
}: {
  members: TeamMember[];
  onOpen: (m: TeamMember) => void;
  onEdit: (m: TeamMember) => void;
  onToggleActive: (m: TeamMember) => void;
  onRemove: (m: TeamMember) => void;
}) {
  return (
    <section className="mt-4 space-y-2">
      {members.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/50">
          No team members match your filters.
        </div>
      )}
      {members.map((m) => (
        <StaffCard
          key={m.id}
          member={m}
          onOpen={() => onOpen(m)}
          onEdit={() => onEdit(m)}
          onToggleActive={() => onToggleActive(m)}
          onRemove={() => onRemove(m)}
        />
      ))}
    </section>
  );
}

function StaffCard({
  member,
  onOpen,
  onEdit,
  onToggleActive,
  onRemove,
}: {
  member: TeamMember;
  onOpen: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}) {
  const hours = hoursThisMonth(member).toFixed(1);
  const isOwnerRow = member.id === "owner";
  const dim = member.status === "inactive";

  return (
    <div
      className={
        "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05] " +
        (dim ? "opacity-60" : "")
      }
    >
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
          {initials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-white">{member.name}</p>
            <RolePill member={member} />
            <StatusPill status={member.status} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/60">
            <span className="truncate">{member.email}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hours}h this month
            </span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Edit"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        {!isOwnerRow && (
          <>
            <button
              onClick={onToggleActive}
              className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              aria-label={member.status === "inactive" ? "Reactivate" : "Deactivate"}
              title={member.status === "inactive" ? "Reactivate" : "Deactivate"}
            >
              <Power className="h-4 w-4" />
            </button>
            <button
              onClick={onRemove}
              className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Remove"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
