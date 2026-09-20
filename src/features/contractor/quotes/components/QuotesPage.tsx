/**
 * QuotesPage — list + create/edit tradespeople quotes.
 *
 * Quotes are stored in the database as bids on a job (`public.job_bids`), so a
 * sent quote shows up for the homeowner as a real bid on their project.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listMyBids, setMyBidStatus, deleteMyBid, type MyBid } from "@/lib/job-bids.functions";
import {
  bidToQuote,
  quoteTotal,
  type Quote,
  type QuoteStatus,
} from "@/features/contractor/quotes/quote-model";
import { addInvoice } from "@/features/contractor/profile/components/toolbelt/invoice-store";

import { STATUS_META, eur, type FilterKey } from "./quotes-page/constants";
import { StatCard } from "./quotes-page/StatCard";
import { EmptyState } from "./quotes-page/EmptyState";
import { QuoteCard } from "./quotes-page/QuoteCard";
import { QuoteEditorSheet } from "./quotes-page/QuoteEditorSheet";

export const QUOTES_QUERY_KEY = ["my-bids"] as const;

export function QuotesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBids = useServerFn(listMyBids);
  const changeStatus = useServerFn(setMyBidStatus);
  const removeBid = useServerFn(deleteMyBid);

  const bidsQuery = useQuery({
    queryKey: QUOTES_QUERY_KEY,
    queryFn: () => fetchBids(),
  });

  const quotes: Quote[] = useMemo(
    () => ((bidsQuery.data?.bids ?? []) as MyBid[]).map(bidToQuote),
    [bidsQuery.data],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "sent" | "withdrawn" }) =>
      changeStatus({ data: vars }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeBid({ data: { id } }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = statusMutation.isPending || deleteMutation.isPending;

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
            Every quote is a bid on a project — send it and the homeowner sees it right away.
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
          {(["all", "draft", "sent", "accepted", "declined", "withdrawn"] as FilterKey[]).map(
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
        {bidsQuery.isPending ? (
          <ul className="space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </ul>
        ) : bidsQuery.isError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-100">
            Could not load your quotes: {(bidsQuery.error as Error).message}
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => void bidsQuery.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={() => setCreating(true)} hasAny={quotes.length > 0} />
        ) : (
          filtered.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              busy={busy}
              onOpen={() => setEditing(q)}
              onSend={() => {
                statusMutation.mutate(
                  { id: q.id, status: "sent" },
                  {
                    onSuccess: () =>
                      toast.success(`Quote ${q.number} sent`, {
                        description: `${q.clientName} can now see it as a bid on their project.`,
                      }),
                  },
                );
              }}
              onWithdraw={() => {
                statusMutation.mutate(
                  { id: q.id, status: "withdrawn" },
                  { onSuccess: () => toast(`Withdrew ${q.number}`) },
                );
              }}
              onOpenJob={() => void navigate({ to: "/contractor/jobs/active" })}
              onConvertInvoice={() => {
                const total = quoteTotal(q);
                addInvoice({
                  date: new Date().toISOString().slice(0, 10),
                  client: q.clientName,
                  description: q.jobTitle,
                  amount: total,
                  status: "draft",
                });
                toast.success("Converted to Invoice draft", {
                  description: `${eur(total)} · ${q.clientName}`,
                });
              }}
              onDelete={() => {
                deleteMutation.mutate(q.id, {
                  onSuccess: () => toast(`Deleted ${q.number}`),
                });
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
