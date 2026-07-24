import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EntryKind = "approved" | "available";

type CalendarEntry = {
  id: string;
  kind: EntryKind;
  date: Date; // day-only granularity is fine for the placeholder
  title: string;
  location?: string;
  homeowner?: string;
  window?: string;
};

// Placeholder data — swap with real marketplace / homeowner feeds later.
function seedEntries(): CalendarEntry[] {
  const today = new Date();
  const mk = (offset: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  return [
    {
      id: "a1",
      kind: "approved",
      date: mk(1),
      title: "Bathroom retile — Fischer",
      location: "Stuttgart-West",
      homeowner: "M. Fischer",
      window: "08:00 – 12:00",
    },
    {
      id: "v1",
      kind: "available",
      date: mk(2),
      title: "Kitchen faucet swap",
      location: "Bad Cannstatt",
      homeowner: "S. Bauer",
      window: "Any morning",
    },
    {
      id: "v2",
      kind: "available",
      date: mk(4),
      title: "Balcony railing repair",
      location: "Vaihingen",
      homeowner: "T. Keller",
      window: "Afternoons",
    },
    {
      id: "a2",
      kind: "approved",
      date: mk(6),
      title: "Radiator install — Weber",
      location: "Feuerbach",
      homeowner: "L. Weber",
      window: "09:00 – 15:00",
    },
  ];
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatFullDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CalendarPage() {
  const [entries] = useState<CalendarEntry[]>(() => seedEntries());
  const [selected, setSelected] = useState<Date | undefined>(() => new Date());

  const approvedDates = useMemo(
    () => entries.filter((e) => e.kind === "approved").map((e) => e.date),
    [entries],
  );
  const availableDates = useMemo(
    () => entries.filter((e) => e.kind === "available").map((e) => e.date),
    [entries],
  );

  const dayEntries = useMemo(() => {
    if (!selected) return [];
    return entries.filter((e) => sameDay(e.date, selected));
  }, [entries, selected]);

  function confirmDate(entry: CalendarEntry) {
    toast.message("Date confirmed", {
      description: `${entry.title} — ${formatFullDate(entry.date)}${entry.window ? ` · ${entry.window}` : ""}`,
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>
        <p className="mt-1 text-sm text-white/60">
          Approved jobs, homeowner availability, and the dates you can confirm.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-orange-300 ring-1 ring-inset ring-white/10">
            <CalendarIcon className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Month view</h2>
            <p className="text-xs text-white/55">
              Tap a day to see approved jobs and open windows.
            </p>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ approved: approvedDates, available: availableDates }}
          modifiersClassNames={{
            approved:
              "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-emerald-400",
            available:
              "relative before:content-[''] before:absolute before:bottom-1 before:left-[calc(50%-6px)] before:h-1 before:w-1 before:rounded-full before:bg-sky-400",
          }}
          className={cn("pointer-events-auto rounded-xl bg-transparent p-2")}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Approved job
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Homeowner availability
          </span>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              Selected day
            </p>
            <h3 className="mt-0.5 truncate text-base font-semibold text-white">
              {selected ? formatFullDate(selected) : "No day selected"}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-inset ring-white/10">
            {dayEntries.length} {dayEntries.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {dayEntries.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/55">
              <Sparkles className="h-4 w-4 text-white/40" strokeWidth={1.75} />
              Nothing scheduled. Pick another day or wait for new matches.
            </div>
          )}

          {dayEntries.map((entry) => {
            const approved = entry.kind === "approved";
            return (
              <article
                key={entry.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset " +
                          (approved
                            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                            : "bg-sky-500/15 text-sky-300 ring-sky-400/30")
                        }
                      >
                        {approved ? (
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                        ) : (
                          <Clock className="h-3 w-3" strokeWidth={2} />
                        )}
                        {approved ? "Approved" : "Available"}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{entry.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                      {entry.homeowner && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" strokeWidth={1.75} />
                          {entry.homeowner}
                        </span>
                      )}
                      {entry.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" strokeWidth={1.75} />
                          {entry.location}
                        </span>
                      )}
                      {entry.window && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={1.75} />
                          {entry.window}
                        </span>
                      )}
                    </div>
                  </div>
                  {!approved && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => confirmDate(entry)}
                      className="shrink-0 bg-orange-500 text-white hover:bg-orange-500/90"
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Placeholder data — wired for approved jobs and homeowner availability next.
      </p>
    </div>
  );
}
