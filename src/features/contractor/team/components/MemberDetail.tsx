/**
 * MemberDetail — Staff profile with tabbed sections.
 *
 * Tabs: Overview, Documents & Compliance, Hours & Activity, Permissions.
 * Time entry, receipt upload, and job photo capture live in Daily Log.
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Receipt,
  Camera,
  Pencil,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  PERMISSION_LEVELS,
  PERMISSION_PRESETS,
  hoursThisMonth,
  updateMember,
  type PermissionLevel,
  type StaffPermissions,
  type TeamMember,
} from "@/features/contractor/team/team-store";
import {
  initials,
  RolePill,
  StatusPill,
  roleLabel,
} from "@/features/contractor/team/components/TeamPage";
import { TradeComplianceChecklist } from "@/features/contractor/team/components/TradeComplianceChecklist";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function MemberDetail({
  member,
  onBack,
  onEdit,
}: {
  member: TeamMember;
  onBack: () => void;
  onEdit: () => void;
}) {
  const totalHours = member.timeLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
  const monthHours = hoursThisMonth(member);
  const totalExpenses = member.receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const isStaff = member.role !== "Owner";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </button>

      {/* Profile header */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/10 text-xl font-bold text-white">
            {initials(member.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{member.name}</h1>
              <RolePill member={member} />
              <StatusPill status={member.status} />
            </div>
            <p className="mt-1 text-sm text-white/60">{roleLabel(member)}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {member.email}
              </span>
              {member.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {member.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined{" "}
                {formatDate(member.joinedAt ?? member.invitedAt)}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
          <MiniStat icon={Clock} label="Hours this month" value={monthHours.toFixed(1)} />
          <MiniStat icon={Clock} label="Total hours" value={totalHours.toFixed(1)} />
          <MiniStat icon={Receipt} label="Expenses" value={`€${totalExpenses.toFixed(2)}`} />
          <MiniStat icon={Camera} label="Photos" value={String(member.photos.length)} />
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-5">
        <TabsList className="w-full justify-start overflow-x-auto bg-white/[0.03]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents & Compliance</TabsTrigger>
          <TabsTrigger value="activity">Hours & Activity</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab member={member} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          {isStaff ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-orange-300" />
                <div>
                  <p className="font-semibold text-white">Staff document log</p>
                  <p className="mt-1 text-white/60">
                    Upload master certificates, insurance proofs, or certifications for this staff
                    member from the compliance checklist. Verification status appears here once
                    documents are logged.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <TradeComplianceChecklist />
              </div>
            </div>
          ) : (
            <TradeComplianceChecklist />
          )}
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab member={member} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab member={member} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------ Tabs ---------------------------------- */

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/10">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function OverviewTab({ member }: { member: TeamMember }) {
  const level = member.permissionLevel ?? (member.role === "Owner" ? "full" : "limited");
  const levelInfo = PERMISSION_LEVELS.find((l) => l.value === level);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InfoCard title="Contact">
        <Row label="Email" value={member.email} />
        <Row label="Phone" value={member.phone ?? "—"} />
      </InfoCard>
      <InfoCard title="Employment">
        <Row label="Role" value={roleLabel(member)} />
        <Row label="Joined" value={formatDate(member.joinedAt ?? member.invitedAt)} />
        <Row label="Status" value={member.status[0].toUpperCase() + member.status.slice(1)} />
      </InfoCard>
      <InfoCard title="Access level" className="md:col-span-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-300" />
          <span className="text-sm font-semibold text-white">{levelInfo?.label ?? "Custom"}</span>
        </div>
        <p className="mt-1 text-xs text-white/60">{levelInfo?.description}</p>
      </InfoCard>
    </div>
  );
}

function InfoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-2xl border border-white/10 bg-white/[0.03] p-4 " + (className ?? "")}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/60">{label}</span>
      <span className="truncate font-medium text-white">{value}</span>
    </div>
  );
}

function ActivityTab({ member }: { member: TeamMember }) {
  const recent = useMemo(
    () =>
      member.timeLogs
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 15),
    [member.timeLogs],
  );

  const monthHours = hoursThisMonth(member);
  const total = member.timeLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat icon={Clock} label="This month" value={`${monthHours.toFixed(1)}h`} />
        <MiniStat icon={Clock} label="All time" value={`${total.toFixed(1)}h`} />
        <MiniStat icon={FileText} label="Entries" value={String(member.timeLogs.length)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Recent time entries</p>
          <p className="text-xs text-white/50">Log new entries in Daily Log</p>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-white/50">
            No hours logged yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5">
                  <Clock className="h-3.5 w-3.5 text-white/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {l.date} · {l.hours}h{" "}
                    {l.jobRef && <span className="text-white/60">· {l.jobRef}</span>}
                  </p>
                  {l.note && <p className="truncate text-xs text-white/60">{l.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionsTab({ member }: { member: TeamMember }) {
  const [level, setLevel] = useState<PermissionLevel>(
    member.permissionLevel ?? (member.role === "Owner" ? "full" : "limited"),
  );
  const isOwnerRow = member.id === "owner";

  function apply(next: PermissionLevel) {
    if (isOwnerRow) return;
    setLevel(next);
    const permissions: StaffPermissions = PERMISSION_PRESETS[next];
    updateMember(member.id, {
      permissionLevel: next,
      permissions,
      role: next === "full" ? "Owner" : "Staff",
    });
    toast.success(`Access updated to ${PERMISSION_LEVELS.find((l) => l.value === next)?.label}`);
  }

  return (
    <div className="space-y-3">
      {isOwnerRow && (
        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70">
          <Info className="mt-0.5 h-3.5 w-3.5" /> The workspace owner keeps full access. Assign
          owner rights to another member from that member's profile.
        </div>
      )}
      {PERMISSION_LEVELS.map((opt) => {
        const active = level === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isOwnerRow}
            onClick={() => apply(opt.value)}
            className={
              "block w-full rounded-2xl border p-4 text-left transition " +
              (active
                ? "border-orange-400/60 bg-orange-500/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]") +
              (isOwnerRow ? " cursor-not-allowed opacity-70" : "")
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{opt.label}</p>
                <p className="mt-0.5 text-xs text-white/60">{opt.description}</p>
              </div>
              {active && <CheckCircle2 className="h-5 w-5 text-orange-300" />}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
                  Can
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                  {opt.can.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300/80" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              {opt.cannot.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
                    Cannot
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                    {opt.cannot.map((c) => (
                      <li key={c} className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/80" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
