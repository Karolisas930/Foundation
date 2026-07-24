import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXTENDED_ROLES,
  PERMISSION_LEVELS,
  PERMISSION_PRESETS,
  inviteMember,
  inviteMemberRemote,
  type ExtendedRole,
  type PermissionLevel,
} from "@/features/contractor/team/team-store";

export function InviteMemberDialog({
  open,
  onOpenChange,
  ownerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ownerId: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState<ExtendedRole>("Journeyman");
  const [level, setLevel] = useState<PermissionLevel>("limited");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (title === "Owner") setLevel("full");
    else if (title === "Office") setLevel("financial");
    else if (title === "Subcontractor") setLevel("view");
    else if (title === "Other") setLevel("limited");
    else setLevel("limited");
  }, [title]);

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setTitle("Journeyman");
    setLevel("limited");
  }

  async function send() {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }
    setSending(true);
    const role = title === "Owner" ? "Owner" : "Staff";
    const permissions = PERMISSION_PRESETS[level];
    inviteMember({ name, email, role, title, permissionLevel: level, phone, permissions });
    if (ownerId) {
      try {
        await inviteMemberRemote({ ownerId, name, email, role, permissions });
      } catch (err) {
        console.warn("[team] inviteMemberRemote failed:", err);
        toast.error("Could not save invite to the database.", {
          description: err instanceof Error ? err.message : String(err),
        });
        setSending(false);
        return;
      }
    }
    toast.success("Invite sent", { description: `${email} will receive an invitation email.` });
    reset();
    setSending(false);
    onOpenChange(false);
  }

  const roleInfo = EXTENDED_ROLES.find((r) => r.value === title);
  const levelInfo = PERMISSION_LEVELS.find((l) => l.value === level)!;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-slate-900 text-white sm:max-w-lg">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-orange-300" /> Invite a team member
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Send an email invite, pick their professional role and choose what they can see and do.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Contact details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inv-name">Name</Label>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-phone">Phone (optional)</Label>
                <Input
                  id="inv-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 …"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Role
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Their professional qualification or job title on the crew.
              </p>
            </div>
            <Select value={title} onValueChange={(v) => setTitle(v as ExtendedRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXTENDED_ROLES.filter((r) => r.value !== "Owner").map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleInfo && (
              <p className="flex items-start gap-1.5 text-xs text-white/60">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {roleInfo.hint}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Access level
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Controls what this person can see and do inside the app. Independent of their role.
              </p>
            </div>

            <div className="grid gap-2">
              {PERMISSION_LEVELS.map((opt) => {
                const active = level === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLevel(opt.value)}
                    className={
                      "rounded-xl border px-3.5 py-3 text-left transition " +
                      (active
                        ? "border-orange-400/60 bg-orange-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{opt.label}</span>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-orange-300" strokeWidth={2} />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{opt.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {levelInfo.label} — what they can do
              </p>
              <ul className="mt-2 space-y-1 text-xs text-emerald-200/90">
                {levelInfo.can.map((c) => (
                  <li key={c} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
              {levelInfo.cannot.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
                  {levelInfo.cannot.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="flex items-start gap-1.5 text-xs text-white/50">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              You can change access permissions later in the team member's profile.
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void send()}
            disabled={sending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {sending ? "Sending…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
