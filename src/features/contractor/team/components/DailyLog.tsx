/**
 * DailyLog — Site diary for owners and crew.
 *
 * Time entries, receipts & expenses, and job site photos live here,
 * scoped to the currently-viewed team member (owner by default).
 * Moved out of the staff profile to keep Team & Staff focused on
 * roster management.
 */
import { useEffect, useMemo, useState } from "react";
import { BookMarked, Clock, Receipt, Camera, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  addPhoto,
  addReceipt,
  addTimeLog,
  loadTeam,
  readFileAsDataUrl,
  removePhoto,
  removeReceipt,
  removeTimeLog,
  subscribeTeam,
  type TeamMember,
} from "@/features/contractor/team/team-store";

export function DailyLog() {
  const [team, setTeam] = useState<TeamMember[]>(() => loadTeam());
  const [selectedId, setSelectedId] = useState<string>("owner");

  useEffect(() => subscribeTeam(() => setTeam(loadTeam())), []);

  const activeStaff = useMemo(() => team.filter((m) => m.status !== "inactive"), [team]);

  const member = useMemo(
    () => team.find((m) => m.id === selectedId) ?? team[0],
    [team, selectedId],
  );

  if (!member) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-orange-300 ring-1 ring-inset ring-white/10">
            <BookMarked className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Daily Log</h1>
            <p className="mt-1 text-sm text-white/60">
              Site diary — log hours, capture receipts, and add before/after job photos.
            </p>
          </div>
        </div>
        <div className="relative">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeStaff.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} {m.id === "owner" ? "· You" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/40" />
        </div>
      </div>

      <Tabs defaultValue="time" className="mt-6">
        <TabsList className="w-full justify-start bg-white/[0.03]">
          <TabsTrigger value="time">
            <Clock className="mr-1.5 h-3.5 w-3.5" /> Time
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Receipts
          </TabsTrigger>
          <TabsTrigger value="photos">
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Photos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="time" className="mt-4">
          <TimeTrackingSection member={member} />
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <ReceiptsSection member={member} />
        </TabsContent>
        <TabsContent value="photos" className="mt-4">
          <PhotosSection member={member} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------------- Time ---------------------------- */

function TimeTrackingSection({ member }: { member: TeamMember }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [jobRef, setJobRef] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    const h = parseFloat(hours);
    if (!date || !Number.isFinite(h) || h <= 0) {
      toast.error("Enter a valid date and hours.");
      return;
    }
    addTimeLog(member.id, { date, hours: h, jobRef: jobRef || undefined, note: note || undefined });
    setHours("");
    setJobRef("");
    setNote("");
    toast.success("Time logged");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-1">
          <Label>Hours</Label>
          <Input
            type="number"
            min={0}
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 4.5"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Job ref (optional)</Label>
          <Input
            value={jobRef}
            onChange={(e) => setJobRef(e.target.value)}
            placeholder="Job #123 or address"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-4">
          <Label>Note (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-1.5 h-4 w-4" /> Add entry
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {member.timeLogs.length === 0 && (
          <p className="text-xs text-white/50">No hours logged yet.</p>
        )}
        {member.timeLogs
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {l.date} · {l.hours}h{" "}
                  {l.jobRef && <span className="text-white/60">· {l.jobRef}</span>}
                </p>
                {l.note && <p className="truncate text-xs text-white/60">{l.note}</p>}
              </div>
              <button
                onClick={() => removeTimeLog(member.id, l.id)}
                className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Delete entry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

/* -------------------------- Receipts -------------------------- */

function ReceiptsSection({ member }: { member: TeamMember }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await readFileAsDataUrl(f);
      setDataUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  function submit() {
    const amt = parseFloat(amount);
    if (!label.trim() || !Number.isFinite(amt)) {
      toast.error("Enter a label and amount.");
      return;
    }
    addReceipt(member.id, {
      label: label.trim(),
      amount: amt,
      vendor: vendor || undefined,
      date,
      dataUrl,
    });
    setLabel("");
    setAmount("");
    setVendor("");
    setDataUrl(undefined);
    toast.success("Receipt added");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Label>Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Materials, fuel…"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-1">
          <Label>Amount (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Vendor (optional)</Label>
          <Input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="OBI, Bauhaus…"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Photo (optional)</Label>
          <Input type="file" accept="image/*" onChange={onFile} className="mt-1" />
          {dataUrl && (
            <img
              src={dataUrl}
              alt="Receipt preview"
              className="mt-2 h-20 w-auto rounded-lg border border-white/10 object-cover"
            />
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-1.5 h-4 w-4" /> Add receipt
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {member.receipts.length === 0 && <p className="text-xs text-white/50">No receipts yet.</p>}
        {member.receipts
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              {r.dataUrl ? (
                <img src={r.dataUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
                  <Receipt className="h-4 w-4 text-white/70" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {r.label} — €{r.amount.toFixed(2)}
                </p>
                <p className="truncate text-xs text-white/60">
                  {r.date} {r.vendor ? `· ${r.vendor}` : ""}
                </p>
              </div>
              <button
                onClick={() => removeReceipt(member.id, r.id)}
                className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Delete receipt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

/* --------------------------- Photos --------------------------- */

function PhotosSection({ member }: { member: TeamMember }) {
  const [kind, setKind] = useState<"before" | "after">("before");
  const [jobRef, setJobRef] = useState("");
  const [note, setNote] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await readFileAsDataUrl(f);
      addPhoto(member.id, { kind, jobRef: jobRef || undefined, note: note || undefined, dataUrl });
      toast.success("Photo added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Label>Type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as "before" | "after")}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before">Before</SelectItem>
              <SelectItem value="after">After</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-3">
          <Label>Job ref (optional)</Label>
          <Input value={jobRef} onChange={(e) => setJobRef(e.target.value)} className="mt-1" />
        </div>
        <div className="sm:col-span-4">
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
        </div>
        <div className="sm:col-span-4">
          <Label>Upload photo</Label>
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            className="mt-1"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {member.photos.length === 0 && (
          <p className="col-span-full text-xs text-white/50">No photos yet.</p>
        )}
        {member.photos
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
            >
              <img src={p.dataUrl} alt="" className="aspect-square w-full object-cover" />
              <span
                className={
                  "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                  (p.kind === "before"
                    ? "bg-sky-500/80 text-white"
                    : "bg-emerald-500/80 text-white")
                }
              >
                {p.kind}
              </span>
              <button
                onClick={() => removePhoto(member.id, p.id)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/80 hover:text-white"
                aria-label="Delete photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {(p.jobRef || p.note) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] text-white">
                  {p.jobRef && <p className="font-semibold">{p.jobRef}</p>}
                  {p.note && <p className="truncate text-white/80">{p.note}</p>}
                </div>
              )}
            </div>
          ))}
      </div>
    </section>
  );
}
