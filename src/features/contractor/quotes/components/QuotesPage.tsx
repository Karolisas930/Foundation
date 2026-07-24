/**
 * QuotesPage — list + create/edit tradespeople quotes.
 * Sub-components live under ./quotes-page/.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useQuotes,
  addQuote,
  updateQuote,
  removeQuote,
  setQuoteStatus,
  quoteTotal,
  type Quote,
  type QuoteStatus,
} from "@/features/contractor/quotes/quotes-store";
import { addInvoice } from "@/features/contractor/profile/components/toolbelt/invoice-store";
import { addLocalJob, setActiveJobId } from "@/features/contractor/team/site-diary-store";

import { STATUS_META, eur, type FilterKey } from "./quotes-page/constants";
import { StatCard } from "./quotes-page/StatCard";
import { EmptyState } from "./quotes-page/EmptyState";
import { QuoteCard } from "./quotes-page/QuoteCard";
import { QuoteEditorSheet } from "./quotes-page/QuoteEditorSheet";

export function QuotesPage() {
  const navigate = useNavigate();
  const quotes = useQuotes();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const base = { all: quotes.length } as Record<FilterKey, number>;
    (Object.keys(STATUS_META) as QuoteStatus[]).forEach(
      (s) => (base[s] = quotes.filter((q) => q.status === s).length),
    );
    return base;
  }, [quotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (filter !== "all" && quote.status !== filter) return false;
      if (!q) return true;
      return (
        quote.number.toLowerCase().includes(q) ||
        quote.clientName.toLowerCase().includes(q) ||
        quote.jobTitle.toLowerCase().includes(q)
      );
    });
  }, [quotes, filter, query]);

  const totals = useMemo(() => {
    const outstanding = quotes
      .filter((q) => q.status === "sent" || q.status === "accepted")
      .reduce((s, q) => s + quoteTotal(q), 0);
    return { outstanding };
  }, [quotes]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-glow">
            Sales pipeline
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
            <FileText className="h-6 w-6 text-orange-glow" aria-hidden />
            Quotes
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Draft, send, and convert quotes into active jobs or invoices.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow hover:from-orange-500 hover:to-orange-700"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Quote
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Total" value={counts.all} />
        <StatCard label="Sent" value={counts.sent} tone="sky" />
        <StatCard label="Accepted" value={counts.accepted} tone="emerald" />
        <StatCard label="Outstanding" value={eur(totals.outstanding)} tone="orange" />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, title, or #"
            className="border-white/10 bg-white/5 pl-9 text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <div className="-mx-1 flex flex-wrap gap-1.5 overflow-x-auto px-1">
          {(["all", "draft", "sent", "accepted", "declined", "converted"] as FilterKey[]).map(
            (k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filter === k
                    ? "border-orange-400/40 bg-orange-500/15 text-orange-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {k === "all" ? "All" : STATUS_META[k].label}
                <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-100">
                  {counts[k]}
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setCreating(true)} hasAny={quotes.length > 0} />
        ) : (
          filtered.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onOpen={() => setEditing(q)}
              onSend={() => {
                setQuoteStatus(q.id, "sent");
                toast.success(`Quote ${q.number} sent to ${q.clientName}`, {
                  description: "PDF prepared and email dispatched (simulated).",
                });
              }}
              onAccept={() => {
                setQuoteStatus(q.id, "accepted");
                toast.success(`Marked ${q.number} accepted`);
              }}
              onDecline={() => {
                setQuoteStatus(q.id, "declined");
                toast(`Marked ${q.number} declined`);
              }}
              onConvertJob={() => {
                const job = addLocalJob(q.jobTitle || `Job from ${q.number}`);
                setActiveJobId(job.id);
                updateQuote(q.id, {
                  status: "converted",
                  convertedAt: Date.now(),
                  convertedTo: "job",
                  convertedRefId: job.id,
                });
                toast.success("Converted to Active Job", {
                  description: "Opening Site Diary…",
                  action: {
                    label: "Open",
                    onClick: () => void navigate({ to: "/contractor/jobs/active" }),
                  },
                });
                void navigate({ to: "/contractor/jobs/active" });
              }}
              onConvertInvoice={() => {
                const total = quoteTotal(q);
                const inv = addInvoice({
                  date: new Date().toISOString().slice(0, 10),
                  client: q.clientName,
                  description: q.jobTitle,
                  amount: total,
                  status: "draft",
                });
                updateQuote(q.id, {
                  status: "converted",
                  convertedAt: Date.now(),
                  convertedTo: "invoice",
                  convertedRefId: inv.id,
                });
                toast.success("Converted to Invoice draft", {
                  description: `${eur(total)} · ${q.clientName}`,
                });
              }}
              onDuplicate={() => {
                addQuote({
                  clientName: q.clientName,
                  clientEmail: q.clientEmail,
                  jobTitle: `${q.jobTitle} (copy)`,
                  description: q.description,
                  items: q.items.map((i) => ({
                    ...i,
                    id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  })),
                  validDays: q.validDays,
                  notes: q.notes,
                });
                toast.success("Duplicated as new draft");
              }}
              onDelete={() => {
                removeQuote(q.id);
                toast(`Deleted ${q.number}`);
              }}
            />
          ))
        )}
      </div>

      <QuoteEditorSheet
        open={creating || Boolean(editing)}
        quote={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
