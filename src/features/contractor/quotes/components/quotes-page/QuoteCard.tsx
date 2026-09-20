import { Send, Trash2, Undo2, Mail, Euro, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quoteTotal, type Quote } from "@/features/contractor/quotes/quote-model";
import { STATUS_META, eur } from "./constants";

export function QuoteCard({
  quote,
  busy,
  onOpen,
  onSend,
  onWithdraw,
  onOpenJob,
  onConvertInvoice,
  onDelete,
}: {
  quote: Quote;
  busy: boolean;
  onOpen: () => void;
  onSend: () => void;
  onWithdraw: () => void;
  onOpenJob: () => void;
  onConvertInvoice: () => void;
  onDelete: () => void;
}) {
  const total = quoteTotal(quote);
  const meta = STATUS_META[quote.status];
  const created = new Date(quote.createdAt).toLocaleDateString("de-DE");
  const validUntil = new Date(quote.createdAt + quote.validDays * 86400_000).toLocaleDateString(
    "de-DE",
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{quote.number}</span>
            <Badge variant="outline" className={`border ${meta.className} text-[10px]`}>
              {meta.label}
            </Badge>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
            {quote.jobTitle || "Untitled quote"}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-300">
            {quote.clientName}
            {quote.clientEmail ? ` · ${quote.clientEmail}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {quote.items.length} item{quote.items.length === 1 ? "" : "s"} · Created {created} ·
            Valid until {validUntil}
          </p>
        </button>
        <div className="text-right">
          <div className="text-lg font-bold text-orange-glow">{eur(total)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(quote.status === "draft" || quote.status === "withdrawn") && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onSend}>
            <Send className="mr-1 h-3.5 w-3.5" /> Send to client
          </Button>
        )}
        {quote.status === "sent" && (
          <>
            <Button size="sm" variant="ghost" disabled={busy} onClick={onSend}>
              <Mail className="mr-1 h-3.5 w-3.5" /> Resend
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
              onClick={onWithdraw}
            >
              <Undo2 className="mr-1 h-3.5 w-3.5" /> Withdraw
            </Button>
          </>
        )}
        {quote.status === "accepted" && (
          <>
            <Button
              size="sm"
              onClick={onOpenJob}
              className="bg-gradient-to-b from-orange-500 to-orange-600 text-white"
            >
              <Briefcase className="mr-1 h-3.5 w-3.5" /> Open job
            </Button>
            <Button size="sm" variant="secondary" onClick={onConvertInvoice}>
              <Euro className="mr-1 h-3.5 w-3.5" /> To Invoice
            </Button>
          </>
        )}
        {quote.status !== "accepted" && (
          <Button size="sm" variant="ghost" onClick={onOpen}>
            Edit
          </Button>
        )}
        {quote.status !== "accepted" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
            onClick={onDelete}
            aria-label="Delete quote"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </article>
  );
}
