import { CheckCircle2, Clock, Crown, Shield } from "lucide-react";
import type { TeamMember } from "@/features/contractor/team/team-store";

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function roleLabel(m: TeamMember): string {
  if (m.title) return m.title === "Office" ? "Office Staff" : m.title;
  return m.role;
}

export function RolePill({ member }: { member: TeamMember }) {
  const isOwner = member.role === "Owner" || member.title === "Owner";
  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-inset ring-orange-400/30">
        <Crown className="h-3 w-3" /> Owner
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300 ring-1 ring-inset ring-sky-400/30">
      <Shield className="h-3 w-3" /> {roleLabel(member)}
    </span>
  );
}

export function StatusPill({ status }: { status: TeamMember["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/30">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 ring-1 ring-inset ring-white/15">
      Inactive
    </span>
  );
}
