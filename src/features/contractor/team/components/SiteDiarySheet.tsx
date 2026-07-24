/**
 * SiteDiarySheet — On-site workflow tools bundled into one sheet.
 *
 * Panels live in ./site-diary/*: Photos, Voice, Receipts, Signature, Timeline.
 * Data persists locally through `site-diary-store` (offline demo mode).
 */
import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, ClipboardList, Mic, PenLine, Plus, Receipt as ReceiptIcon } from "lucide-react";
import {
  addLocalJob,
  getActiveJobId,
  setActiveJobId,
  useSiteDiaryEntries,
  useSiteDiaryJobs,
} from "@/features/contractor/team/site-diary-store";
import { PhotosPanel } from "./site-diary/PhotosPanel";
import { VoicePanel } from "./site-diary/VoicePanel";
import { ReceiptsPanel } from "./site-diary/ReceiptsPanel";
import { SignaturePanel } from "./site-diary/SignaturePanel";
import { TimelinePanel } from "./site-diary/TimelinePanel";
import { SaveFlash } from "./site-diary/SaveFlash";

type Tab = "photos" | "voice" | "receipts" | "signature" | "timeline";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "photos", label: "Photos", Icon: Camera },
  { id: "voice", label: "Voice", Icon: Mic },
  { id: "receipts", label: "Receipts", Icon: ReceiptIcon },
  { id: "signature", label: "Sign-off", Icon: PenLine },
  { id: "timeline", label: "Timeline", Icon: ClipboardList },
];

export function SiteDiarySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const jobs = useSiteDiaryJobs();
  const [jobId, setJobId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("photos");

  useEffect(() => {
    if (!open) return;
    const active = getActiveJobId();
    const latestJobs = jobs;
    const initial =
      active && latestJobs.some((j) => j.id === active) ? active : (latestJobs[0]?.id ?? null);
    setJobId(initial);
    setTab("photos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeJob = jobs.find((j) => j.id === jobId) ?? null;
  const entries = useSiteDiaryEntries(jobId ?? undefined);

  const [savedFlash, setSavedFlash] = useState<number>(0);
  const prevCountRef = useRef(entries.length);
  useEffect(() => {
    if (entries.length > prevCountRef.current) {
      setSavedFlash(Date.now());
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  function pickJob(id: string) {
    setJobId(id);
    setActiveJobId(id);
  }

  function handleAddJob() {
    const title = window.prompt("New job title");
    if (!title || !title.trim()) return;
    const job = addLocalJob(title);
    pickJob(job.id);
    toast.success("Job added to your Site Diary");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0d10] p-0 text-white shadow-2xl"
      >
        <SheetHeader className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-gradient-to-br from-orange/20 via-[#0b0d10] to-[#0b0d10] p-5 pt-4">
          <div className="mx-auto -mt-1 mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange text-black shadow-lg shadow-orange/30">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-white">Site Diary</SheetTitle>
              <SheetDescription className="text-white/60">
                Everything from today's job, in one place.
              </SheetDescription>
            </div>
            <SaveFlash tick={savedFlash} count={entries.length} />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Active job
            </label>
            <div className="flex items-stretch gap-2">
              <select
                aria-label="Select active job"
                value={jobId ?? ""}
                onChange={(e) => pickJob(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-orange/60"
              >
                {jobs.length === 0 ? <option value="">No active jobs yet</option> : null}
                {jobs.map((j) => (
                  <option key={j.id} value={j.id} className="bg-[#0b0d10]">
                    {j.title}
                    {j.city ? ` · ${j.city}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddJob}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/85 hover:border-orange/50 hover:text-orange"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Site diary tools">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={active}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition ${
                    active
                      ? "bg-orange text-black shadow-lg shadow-orange/30"
                      : "bg-white/[0.05] text-white/80 hover:bg-white/[0.1]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </nav>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          {!activeJob ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
              <p className="text-sm font-semibold text-white">Start by adding a job</p>
              <p className="mt-1 text-xs text-white/60">
                Once you're on-site, add a job so photos, receipts and signatures stay organized in
                one place.
              </p>
              <Button
                onClick={handleAddJob}
                className="mt-4 bg-orange text-black hover:bg-orange/90"
              >
                <Plus className="mr-1 h-4 w-4" /> Add job
              </Button>
            </div>
          ) : (
            <>
              {tab === "photos" && <PhotosPanel job={activeJob} entries={entries} />}
              {tab === "voice" && <VoicePanel job={activeJob} entries={entries} />}
              {tab === "receipts" && <ReceiptsPanel job={activeJob} entries={entries} />}
              {tab === "signature" && <SignaturePanel job={activeJob} entries={entries} />}
              {tab === "timeline" && <TimelinePanel entries={entries} />}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
