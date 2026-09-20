import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Send, Sparkles, Calendar, X, Briefcase } from "lucide-react";
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
import { toast } from "sonner";
import {
  newLineItem,
  makeQuoteNumber,
  quoteToDetails,
  validUntilDate,
  eurToCents,
  type Quote,
  type QuoteLineItem,
} from "@/features/contractor/quotes/quote-model";
import { saveMyBid } from "@/lib/job-bids.functions";
import { listContractorJobFeed, type FeedJob } from "@/lib/job-feed.functions";
import { MARKETPLACE_CLIENTS } from "@/features/contractor/profile/components/toolbelt/marketplace-clients";
import { eur, type Prefill, type FormState } from "./constants";

/** Query key shared with QuotesPage so a saved quote shows up immediately. */
const QUOTES_QUERY_KEY = ["my-bids"] as const;

export function QuoteForm({
  quote,
  prefill,
  onDone,
}: {
  quote: Quote | null;
  prefill?: Prefill | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveMyBid);
  const fetchFeed = useServerFn(listContractorJobFeed);

  const [form, setForm] = useState<FormState>(() => ({
    jobId: quote?.jobId ?? prefill?.jobId ?? "",
    clientName: quote?.clientName ?? prefill?.clientName ?? "",
    clientEmail: quote?.clientEmail ?? prefill?.clientEmail ?? "",
    clientPhone: prefill?.clientPhone ?? "",
    jobTitle: quote?.jobTitle ?? prefill?.jobTitle ?? "",
    description: quote?.description ?? prefill?.description ?? "",
    items: quote?.items?.length ? quote.items : [newLineItem()],
    validDays: quote?.validDays ?? 14,
    notes: quote?.notes ?? "",
  }));

  // Project picker: only needed when the quote is not yet tied to a project
  // (manual / client flows). Existing quotes and lead-based quotes are fixed.
  const needsProjectPicker = !quote && !prefill?.jobId;
  const feedQuery = useQuery({
    queryKey: ["contractor-job-feed"],
    queryFn: () => fetchFeed(),
    enabled: needsProjectPicker,
  });
  const projects: FeedJob[] = useMemo(() => {
    const data = feedQuery.data;
    if (!data) return [];
    const uniq = new Map<string, FeedJob>();
    [...data.priority, ...data.alerts].forEach((l) => uniq.set(l.job.id, l.job));
    return Array.from(uniq.values());
  }, [feedQuery.data]);

  const total = form.items.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  );

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const patchItem = (id: string, p: Partial<QuoteLineItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    }));

  const removeItem = (id: string) =>
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }));

  const applyProject = (id: string) => {
    const p = projects.find((j) => j.id === id);
    if (!p) return;
    patch({
      jobId: p.id,
      jobTitle: form.jobTitle.trim() ? form.jobTitle : p.title,
      description: form.description.trim() ? form.description : p.description,
    });
  };

  const mutation = useMutation({
    mutationFn: (vars: { send: boolean }) => {
      const cleanItems = form.items
        .map((i) => ({
          ...i,
          service: i.service.trim(),
          quantity: Number(i.quantity) || 0,
          unitPrice: Number(i.unitPrice) || 0,
        }))
        .filter((i) => i.service.length > 0);
      const validDays = Math.max(1, Number(form.validDays) || 14);
      const details = quoteToDetails({
        number: quote?.number ?? makeQuoteNumber(),
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim() || null,
        jobTitle: form.jobTitle.trim(),
        description: form.description.trim() || null,
        items: cleanItems,
        validDays,
        notes: form.notes.trim() || null,
      });
      const totalEur = cleanItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      return save({
        data: {
          id: quote?.id,
          jobId: form.jobId,
          laborCents: eurToCents(totalEur),
          materialsCents: 0,
          travelCents: 0,
          message: details.description,
          validUntil: validUntilDate(validDays),
          status: vars.send ? "sent" : "draft",
          details,
        },
      }).then((res) => ({ ...res, number: details.number, clientName: details.clientName }));
    },
    onSuccess: (res, vars) => {
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      toast.success(
        vars.send
          ? `Quote ${res.number} sent to ${res.clientName}`
          : quote
            ? "Quote updated"
            : `Draft ${res.number} saved`,
        vars.send
          ? { description: "The homeowner can now see it as a bid on their project." }
          : undefined,
      );
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (send: boolean) => {
    if (!form.jobId) {
      toast.error("Choose the project this quote is for");
      return;
    }
    if (!form.clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!form.jobTitle.trim()) {
      toast.error("Job title is required");
      return;
    }
    const hasItem = form.items.some((i) => i.service.trim().length > 0);
    if (!hasItem) {
      toast.error("Add at least one line item");
      return;
    }
    mutation.mutate({ send });
  };

  const applyMarketplaceClient = (id: string) => {
    const c = MARKETPLACE_CLIENTS.find((m) => m.id === id);
    if (!c) return;
    patch({ clientName: c.name, clientEmail: c.email ?? "" });
    toast.success(`Client ${c.name} applied`);
  };

  const saving = mutation.isPending;

  return (
    <div className="space-y-5 px-5 py-5">
      {prefill?.sourceLabel && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Prefilled from <strong>{prefill.sourceLabel}</strong>. Review and edit anything before
            sending.
          </span>
        </div>
      )}

      <section className="space-y-2">
        <Label className="text-slate-200">
          <Briefcase className="mr-1 inline h-3.5 w-3.5" /> Project
        </Label>
        {needsProjectPicker ? (
          <>
            <Select value={form.jobId || undefined} onValueChange={applyProject}>
              <SelectTrigger
                aria-label="Project"
                className="border-white/10 bg-white/5 text-slate-100"
              >
                <SelectValue
                  placeholder={
                    feedQuery.isPending
                      ? "Loading open projects…"
                      : projects.length === 0
                        ? "No open projects to quote on"
                        : "Choose the project this quote is for"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                    {p.city ? ` · ${p.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {feedQuery.isError ? (
              <p className="text-xs text-rose-200">
                Could not load projects: {(feedQuery.error as Error).message}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Every quote is a bid on a homeowner project. Pick the project it belongs to.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
            {prefill?.jobLabel ?? quote?.jobTitle ?? "Linked project"}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <Label className="text-slate-200">Client</Label>
        <Select onValueChange={applyMarketplaceClient}>
          <SelectTrigger className="border-white/10 bg-white/5 text-slate-100">
            <SelectValue placeholder="Quick-pick a saved / marketplace client" />
          </SelectTrigger>
          <SelectContent>
            {MARKETPLACE_CLIENTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` · ${c.city}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={form.clientName}
            onChange={(e) => patch({ clientName: e.target.value })}
            placeholder="Client name"
            className="border-white/10 bg-white/5 text-slate-100"
          />
          <Input
            value={form.clientEmail}
            onChange={(e) => patch({ clientEmail: e.target.value })}
            placeholder="Client email (optional)"
            className="border-white/10 bg-white/5 text-slate-100"
          />
        </div>
        <Input
          value={form.clientPhone}
          onChange={(e) => patch({ clientPhone: e.target.value })}
          placeholder="Client phone (optional)"
          className="border-white/10 bg-white/5 text-slate-100"
        />
      </section>

      <section className="space-y-2">
        <Label className="text-slate-200">Job</Label>
        <Input
          value={form.jobTitle}
          onChange={(e) => patch({ jobTitle: e.target.value })}
          placeholder="e.g. Bathroom renovation — Weber"
          className="border-white/10 bg-white/5 text-slate-100"
        />
        <Textarea
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Scope / description (optional)"
          rows={4}
          className="border-white/10 bg-white/5 text-slate-100"
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-200">Line items</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setForm((f) => ({ ...f, items: [...f.items, newLineItem()] }))}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add item
          </Button>
        </div>
        <div className="space-y-2">
          {form.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <Input
                value={item.service}
                onChange={(e) => patchItem(item.id, { service: e.target.value })}
                placeholder="Service or product"
                className="border-white/10 bg-white/5 text-slate-100"
              />
              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Qty</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.25"
                    value={item.quantity}
                    onChange={(e) => patchItem(item.id, { quantity: Number(e.target.value) })}
                    className="border-white/10 bg-white/5 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Unit € (net)</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => patchItem(item.id, { unitPrice: Number(e.target.value) })}
                    className="border-white/10 bg-white/5 text-slate-100"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-rose-200 hover:bg-rose-500/10"
                  aria-label="Remove line"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1 text-right text-xs text-slate-300">
                Line total:{" "}
                <span className="font-semibold text-white">
                  {eur((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-orange-100">Total</span>
          <span className="text-lg font-bold text-orange-glow">{eur(total)}</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-slate-200">
            <Calendar className="mr-1 inline h-3.5 w-3.5" /> Valid for (days)
          </Label>
          <Input
            type="number"
            min="1"
            value={form.validDays}
            onChange={(e) => patch({ validDays: Number(e.target.value) })}
            className="border-white/10 bg-white/5 text-slate-100"
          />
        </div>
      </section>

      <section className="space-y-1.5">
        <Label className="text-slate-200">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Payment terms, warranty, exclusions…"
          rows={3}
          className="border-white/10 bg-white/5 text-slate-100"
        />
      </section>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-white/10 bg-[#0f172a]/95 px-5 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => submit(false)} disabled={saving}>
          Save draft
        </Button>
        <Button
          onClick={() => submit(true)}
          disabled={saving}
          className="bg-gradient-to-b from-orange-500 to-orange-600 text-white"
        >
          <Send className="mr-1.5 h-4 w-4" />
          {saving ? "Saving…" : quote ? "Save & send" : "Send quote"}
        </Button>
      </div>
    </div>
  );
}
