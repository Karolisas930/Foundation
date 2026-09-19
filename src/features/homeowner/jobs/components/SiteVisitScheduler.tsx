/**
 * SiteVisitScheduler — awarded-project banner that lets the homeowner
 * offer up to 7 available days and a preferred time slot for the contractor.
 *
 * Dates + slot are stored in Supabase (`public.site_visits`) and the
 * confirmation is sent to the contractor as a real project message.
 */
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck2, CheckCircle2, Clock, Moon, Sun, Sunrise, X } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { sendProjectMessage } from "@/lib/project-chat.functions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  safeParseISO,
  SLOT_LABEL,
  type SiteVisit,
  type TimeSlot,
} from "../../dashboard/components/parts/helpers";
import { Panel } from "../../dashboard/components/parts/Panel";

export function SiteVisitScheduler({
  project,
  topProposal,
  siteVisits,
  saveVisit,
  calendarOpen,
  setCalendarOpen,
  draftSlot,
  setDraftSlot,
  onCancelRequest,
}: {
  project: EcosystemProject;
  topProposal: EcosystemProposal;
  siteVisits: Record<string, SiteVisit>;
  saveVisit: (jobId: string, visit: SiteVisit, contractorId?: string | null) => Promise<void>;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  draftSlot: TimeSlot;
  setDraftSlot: (slot: TimeSlot) => void;
  onCancelRequest: () => void;
}) {
  const [sending, setSending] = useState(false);
  const sendMessage = useServerFn(sendProjectMessage);

  const visit = siteVisits[project.id];
  const selectedDates = (visit?.dates ?? [])
    .map((d) => safeParseISO(d))
    .filter((d): d is Date => d !== null);
  const activeSlot = visit?.slot ?? draftSlot;

  function persist(next: SiteVisit) {
    void saveVisit(project.id, next, topProposal.profileId ?? null).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not save your availability.");
    });
  }

  function setVisitSlot(slot: TimeSlot) {
    setDraftSlot(slot);
    persist({ dates: visit?.dates ?? [], slot });
  }

  async function confirmSiteVisit() {
    const v = siteVisits[project.id];
    if (!v || v.dates.length === 0) {
      toast.error("Pick at least one date.");
      return;
    }
    if (!topProposal.profileId) {
      toast.error("This contractor cannot be messaged yet.");
      return;
    }
    const stamps = v.dates
      .map((d) => safeParseISO(d))
      .filter((d): d is Date => d !== null)
      .map((d) => format(d, "EEE d MMM"))
      .join(", ");

    setSending(true);
    try {
      await sendMessage({
        data: {
          jobId: project.id,
          peerId: topProposal.profileId,
          body: `Available for site visit: ${stamps} · ${SLOT_LABEL[v.slot]}.`,
        },
      });
      setCalendarOpen(false);
      toast.success(
        `Sent ${v.dates.length} option${v.dates.length === 1 ? "" : "s"} to contractor`,
        { description: SLOT_LABEL[v.slot] },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not notify the contractor.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel className="border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40">
          <CheckCircle2 className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300">
            Bid accepted
          </p>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-white">
            {topProposal.company} is locked in
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Offer up to 7 available days and a preferred time slot — your contractor picks the best
            fit.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button className="h-11 gap-2 rounded-full bg-emerald-500 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.7)] hover:bg-emerald-400">
                  <CalendarCheck2 className="size-4" />
                  {selectedDates.length
                    ? `${selectedDates.length} day${selectedDates.length === 1 ? "" : "s"} · ${SLOT_LABEL[activeSlot].split(" ")[0]}`
                    : "Schedule site visit"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="border-b border-border/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Pick up to 7 days
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedDates.length}/7 selected
                  </p>
                </div>
                <Calendar
                  mode="multiple"
                  max={7}
                  selected={selectedDates}
                  onSelect={(dates) => {
                    const arr = (dates ?? []).slice(0, 7);
                    const isoArr = arr
                      .map((d) => {
                        const x = new Date(d);
                        x.setHours(0, 0, 0, 0);
                        return x.toISOString();
                      })
                      .sort();
                    persist({ dates: isoArr, slot: activeSlot });
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="border-t border-border/60 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Preferred slot
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["morning", "afternoon", "evening"] as TimeSlot[]).map((s) => {
                      const Icon = s === "morning" ? Sunrise : s === "afternoon" ? Sun : Moon;
                      const on = activeSlot === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setVisitSlot(s)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] font-semibold capitalize transition",
                            on
                              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                              : "border-border bg-background hover:bg-muted",
                          )}
                        >
                          <Icon className="size-3.5" />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => void confirmSiteVisit()}
                    disabled={selectedDates.length === 0 || sending}
                    className="mt-3 h-9 w-full rounded-md bg-emerald-500 text-xs font-semibold text-white hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="mr-1.5 size-3.5" />
                    {sending
                      ? "Sending…"
                      : `Send ${selectedDates.length || ""} option${selectedDates.length === 1 ? "" : "s"}`}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {selectedDates.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <Clock className="size-3.5" />
                {selectedDates.map((d) => format(d, "d MMM")).join(", ")} · {SLOT_LABEL[activeSlot]}
              </div>
            )}

            <Button
              variant="outline"
              onClick={onCancelRequest}
              className="h-11 gap-2 rounded-full border-red-400/40 bg-red-500/5 text-red-200 hover:bg-red-500/15 hover:text-red-100"
            >
              <X className="size-4" /> Change mind
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
