// @ts-nocheck — generated Supabase types don't yet include the invoicing schema
/**
 * InvoiceHistoryList — recent invoices, corrections & drafts for the signed-in user.
 *
 * German invoicing rules enforced here:
 *   • Draft invoices    → full edit + delete allowed
 *   • Sent / Paid / Overdue → the original is locked. No direct edit / delete.
 *     The only way to change the amount is to issue a Correction ("Stornorechnung")
 *     which is a new document referencing the original invoice number + date.
 *   • Simple status set: draft / sent / paid / overdue
 *   • Full history (original + all corrections) shown grouped together.
 *
 * The DB additionally enforces the lock via RLS + a BEFORE UPDATE/DELETE trigger
 * (see migration invoices_enforce_lock) so the rule cannot be bypassed even if
 * the UI is patched.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileText,
  Landmark,
  Lock,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
type DocumentType = "invoice" | "correction" | "storno";

function isLocked(inv: Invoice): boolean {
  return inv.status !== "draft";
}

function statusStyle(status: string) {
  switch (status) {
    case "sent":
      return "bg-emerald-500/15 text-emerald-300";
    case "paid":
      return "bg-sky-500/15 text-sky-300";
    case "overdue":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-amber-500/15 text-amber-300";
  }
}

function docTypeLabel(type: string | null): string {
  if (type === "correction") return "Correction";
  if (type === "storno") return "Stornorechnung";
  return "Invoice";
}

export function InvoiceHistoryList() {
  const { user, isAuthenticated } = useAuth();
  const dbAuth = isAuthenticated && !!user?.id && !user.id.startsWith("demo:");
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const [correctTarget, setCorrectTarget] = useState<Invoice | null>(null);
  const [correctReason, setCorrectReason] = useState("");
  const [correctKind, setCorrectKind] = useState<"correction" | "storno">("storno");
  const [correcting, setCorrecting] = useState(false);

  const load = useCallback(async () => {
    if (!dbAuth) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      console.warn("[invoices] load failed", error);
      toast.error("Could not load invoices.");
      return;
    }
    setItems((data ?? []) as Invoice[]);
  }, [dbAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  // Group corrections under their originals so history is easy to read.
  const grouped = useMemo(() => {
    const byId = new Map<string, Invoice>();
    items.forEach((i) => byId.set(i.id, i));
    const originals: Invoice[] = [];
    const childrenByParent = new Map<string, Invoice[]>();
    items.forEach((i) => {
      const parentId = (i as Invoice & { parent_invoice_id?: string | null }).parent_invoice_id;
      if (parentId && byId.has(parentId)) {
        const list = childrenByParent.get(parentId) ?? [];
        list.push(i);
        childrenByParent.set(parentId, list);
      } else {
        originals.push(i);
      }
    });
    return originals.map((inv) => ({
      invoice: inv,
      corrections: (childrenByParent.get(inv.id) ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    }));
  }, [items]);

  async function markSent(inv: Invoice) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as sent.");
    void load();
  }

  async function markPaid(inv: Invoice) {
    const { error } = await supabase.from("invoices").update({ status: "paid" }).eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success(`Invoice ${inv.number} marked as paid.`);
    void load();
  }

  async function removeDraft(inv: Invoice) {
    if (isLocked(inv)) {
      toast.error("Issued invoices cannot be deleted. Create a correction instead.");
      return;
    }
    if (!confirm(`Delete draft ${inv.number ?? inv.id.slice(0, 8)}?`)) return;
    const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
    if (error) return toast.error(error.message);
    void load();
  }

  function openCorrect(inv: Invoice, kind: "correction" | "storno") {
    setCorrectTarget(inv);
    setCorrectKind(kind);
    setCorrectReason("");
  }

  async function submitCorrection() {
    if (!correctTarget || !user?.id) return;
    setCorrecting(true);
    const original = correctTarget;
    const isFullStorno = correctKind === "storno";

    // A Stornorechnung negates the full amount; a correction is a new draft the
    // user can then edit line-by-line. Both automatically reference the
    // original's number + issue date, as required by §14 UStG.
    const originalIssueDate = original.issued_at ?? original.sent_at ?? original.created_at;

    const negate = (n: number | null | undefined) => (n == null ? null : -Number(n));

    const newRow = {
      owner_id: user.id,
      client_id: original.client_id,
      client_name: original.client_name,
      client_email: original.client_email,
      client_address: original.client_address,
      client_vat_id: original.client_vat_id,
      currency: original.currency,
      mode: original.mode,
      status: "draft" as InvoiceStatus,
      document_type: (isFullStorno ? "storno" : "correction") as DocumentType,
      parent_invoice_id: original.id,
      parent_invoice_number: original.number,
      parent_invoice_date: originalIssueDate,
      correction_reason: correctReason.trim() || null,
      number: `${original.number ?? "INV"}-${isFullStorno ? "S" : "K"}${Date.now().toString().slice(-4)}`,
      summary: isFullStorno
        ? `Stornorechnung zu Rechnung ${original.number} vom ${new Date(originalIssueDate).toLocaleDateString("de-DE")}. Grund: ${correctReason.trim() || "—"}`
        : `Korrekturrechnung zu Rechnung ${original.number} vom ${new Date(originalIssueDate).toLocaleDateString("de-DE")}. Grund: ${correctReason.trim() || "—"}`,
      line_items: isFullStorno ? original.line_items : original.line_items,
      subtotal: isFullStorno ? negate(original.subtotal as number | null) : original.subtotal,
      vat_rate: original.vat_rate,
      vat_amount: isFullStorno ? negate(original.vat_amount as number | null) : original.vat_amount,
      net_total: isFullStorno ? negate(original.net_total) : original.net_total,
      gross_total: isFullStorno ? negate(original.gross_total) : original.gross_total,
      hourly_rate: original.hourly_rate,
      hours: original.hours,
      fixed_amount: isFullStorno
        ? negate(original.fixed_amount as number | null)
        : original.fixed_amount,
    };

    const { error } = await supabase.from("invoices").insert(newRow);
    setCorrecting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      isFullStorno
        ? "Stornorechnung created as draft — review and send it."
        : "Correction draft created — edit amounts and send.",
    );
    setCorrectTarget(null);
    void load();
  }

  return (
    <section className="mx-2 mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-orange/15 text-orange">
          <FileText className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-white">Invoice history</h3>
          <p className="text-xs text-slate-400">
            Drafts, sent invoices & corrections. Issued invoices are locked per German invoicing
            rules (§14 UStG).
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
          className="h-8 rounded-full border-white/20 bg-white/[0.04] text-xs text-white hover:bg-white/10"
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {!dbAuth && (
        <div className="rounded-xl bg-white/[0.03] px-3 py-6 text-center text-sm text-slate-400">
          Sign in to see your saved invoices.
        </div>
      )}

      {dbAuth && grouped.length === 0 && !loading && (
        <div className="rounded-xl bg-white/[0.03] px-3 py-6 text-center text-sm text-slate-400">
          No invoices yet. Create your first one above.
        </div>
      )}

      <div className="divide-y divide-white/5">
        {grouped.map(({ invoice: inv, corrections }) => {
          const locked = isLocked(inv);
          const parentIssue = inv.issued_at ?? inv.sent_at ?? inv.created_at;
          return (
            <div key={inv.id} className="py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{inv.number ?? "—"}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyle(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                    {locked && (
                      <span
                        title="Issued — locked per German invoicing rules"
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300"
                      >
                        <Lock className="size-3" /> locked
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {inv.client_name} · {new Date(parentIssue).toLocaleDateString()}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-white">
                    €{Number(inv.gross_total ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] uppercase text-slate-500">{inv.mode ?? "—"}</div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {inv.status === "draft" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void markSent(inv)}
                        className="h-8 rounded-full px-2 text-xs"
                        title="Send / issue"
                      >
                        <Send className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void removeDraft(inv)}
                        className="h-8 rounded-full px-2 text-xs text-rose-300 hover:text-rose-200"
                        title="Delete draft"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                  {locked && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCorrect(inv, "correction")}
                        className="h-8 gap-1 rounded-full bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                        title="Issue a Correction invoice"
                      >
                        <RotateCcw className="size-3.5" /> Correct
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCorrect(inv, "storno")}
                        className="h-8 gap-1 rounded-full bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                        title="Issue a full Stornorechnung"
                      >
                        <AlertTriangle className="size-3.5" /> Stornorechnung
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {inv.status === "sent" && (
                <Button
                  size="sm"
                  onClick={() => void markPaid(inv)}
                  className="mt-2 w-full gap-2 rounded-xl bg-emerald-500/15 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                >
                  <Landmark className="size-3.5" />
                  Mark as Paid (bank transfer received)
                </Button>
              )}

              {corrections.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Correction history ({corrections.length})
                  </div>
                  {corrections.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
                        {docTypeLabel(
                          (c as Invoice & { document_type?: string | null }).document_type ?? null,
                        )}
                      </span>
                      <span className="font-semibold text-white">{c.number}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyle(c.status)}`}
                      >
                        {c.status}
                      </span>
                      <span className="ml-auto font-semibold text-white">
                        €{Number(c.gross_total ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!correctTarget} onOpenChange={(open) => !open && setCorrectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {correctKind === "storno" ? "Create Stornorechnung" : "Create Correction Invoice"}
            </DialogTitle>
            <DialogDescription>
              {correctTarget && (
                <>
                  A new draft will be created that references invoice{" "}
                  <span className="font-semibold">{correctTarget.number}</span> from{" "}
                  <span className="font-semibold">
                    {new Date(
                      correctTarget.issued_at ?? correctTarget.sent_at ?? correctTarget.created_at,
                    ).toLocaleDateString("de-DE")}
                  </span>
                  .{" "}
                  {correctKind === "storno"
                    ? "The full amount will be reversed (negative totals)."
                    : "You can then edit the line items before sending."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="correction-reason">Reason (required for records)</Label>
            <Textarea
              id="correction-reason"
              value={correctReason}
              onChange={(e) => setCorrectReason(e.target.value)}
              placeholder="e.g. wrong VAT rate applied, price adjustment agreed with client, ..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitCorrection()}
              disabled={correcting || correctReason.trim().length === 0}
            >
              {correcting ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
