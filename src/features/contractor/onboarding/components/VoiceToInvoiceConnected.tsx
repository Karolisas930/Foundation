// @ts-nocheck — generated Supabase types don't yet include the invoicing schema
/**
 * VoiceToInvoiceConnected
 *
 * Full end-to-end Voice-to-Invoice flow persisted to Lovable Cloud:
 *   - Fixed Price OR Hourly (rate × hours) modes.
 *   - Night / Weekend / Holiday surcharges (percent of net base).
 *   - Configurable VAT (0 / 7 / 19).
 *   - Client picker: searchable dropdown against the user's clients table
 *     (marketplace + saved). Selecting auto-fills name, address, VAT.
 *     If the typed name doesn't match, it's saved as a new client on send.
 *   - Preview Invoice shows the fully calculated breakdown.
 *   - Save Draft stores the invoice with status = 'draft'.
 *   - Send Invoice stores with status = 'sent', logs sent_at, and (best-effort)
 *     opens the user's mail client with a summary — a real email send hook
 *     can be wired later once an email provider is connected.
 *
 * Not signed in? We surface a friendly CTA and still allow the print-PDF flow
 * so the tool remains usable offline. Persistence needs auth.
 */
import { useEffect, useMemo, useState } from "react";
import { FileText, Printer, Save, Send, Sparkles, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VoiceDictateButton } from "./VoiceDictateButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type InvoiceLineItem = { label: string; qty: number; unit: string; price: number };

type ClientRow = Tables<"clients">;

type Mode = "fixed" | "hourly";

interface Computed {
  base: number;
  surchargeTotal: number;
  net: number;
  vat: number;
  gross: number;
  items: InvoiceLineItem[];
}

function nextInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function formatEUR(n: number) {
  return `€${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

export function VoiceToInvoiceConnected() {
  const { user, isAuthenticated } = useAuth();
  // Demo users have ids starting with "demo:" — treat as unauthenticated for DB.
  const dbAuth = isAuthenticated && !!user?.id && !user.id.startsWith("demo:");

  const [mode, setMode] = useState<Mode>("fixed");
  const [number, setNumber] = useState(nextInvoiceNumber);
  const [summary, setSummary] = useState("");

  // client
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientVat, setClientVat] = useState("");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

  // pricing
  const [fixedAmount, setFixedAmount] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(65);
  const [hours, setHours] = useState<number>(1);

  // surcharges
  const [night, setNight] = useState(false);
  const [nightPct, setNightPct] = useState(25);
  const [weekend, setWeekend] = useState(false);
  const [weekendPct, setWeekendPct] = useState(50);
  const [holiday, setHoliday] = useState(false);
  const [holidayPct, setHolidayPct] = useState(100);

  const [vatRate, setVatRate] = useState<number>(19);

  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load clients on auth
  useEffect(() => {
    if (!dbAuth) return;
    void supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true })
      .limit(200)
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (error) {
          console.warn("[clients] load failed", error);
          return;
        }
        setClients(data ?? []);
      });
  }, [dbAuth]);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 20);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [clients, clientQuery]);

  const computed = useMemo<Computed>(() => {
    const base =
      mode === "fixed"
        ? Number(fixedAmount) || 0
        : (Number(hourlyRate) || 0) * (Number(hours) || 0);
    const items: InvoiceLineItem[] = [];
    if (mode === "fixed") {
      items.push({ label: summary.trim() || "Service", qty: 1, unit: "pos", price: base });
    } else {
      items.push({
        label: summary.trim() || "Labor",
        qty: Number(hours) || 0,
        unit: "h",
        price: Number(hourlyRate) || 0,
      });
    }
    let surchargeTotal = 0;
    if (night) {
      const s = +(base * (nightPct / 100)).toFixed(2);
      surchargeTotal += s;
      items.push({ label: `Night surcharge (${nightPct}%)`, qty: 1, unit: "pos", price: s });
    }
    if (weekend) {
      const s = +(base * (weekendPct / 100)).toFixed(2);
      surchargeTotal += s;
      items.push({ label: `Weekend surcharge (${weekendPct}%)`, qty: 1, unit: "pos", price: s });
    }
    if (holiday) {
      const s = +(base * (holidayPct / 100)).toFixed(2);
      surchargeTotal += s;
      items.push({ label: `Holiday surcharge (${holidayPct}%)`, qty: 1, unit: "pos", price: s });
    }
    const net = +(base + surchargeTotal).toFixed(2);
    const vat = +(net * (vatRate / 100)).toFixed(2);
    const gross = +(net + vat).toFixed(2);
    return {
      base: +base.toFixed(2),
      surchargeTotal: +surchargeTotal.toFixed(2),
      net,
      vat,
      gross,
      items,
    };
  }, [
    mode,
    fixedAmount,
    hourlyRate,
    hours,
    summary,
    night,
    nightPct,
    weekend,
    weekendPct,
    holiday,
    holidayPct,
    vatRate,
  ]);

  function selectClient(c: ClientRow) {
    setSelectedClient(c);
    setClientQuery(c.name);
    setClientEmail(c.email ?? "");
    setClientAddress(
      [
        c.address_line1,
        c.address_line2,
        [c.postal_code, c.city].filter(Boolean).join(" "),
        c.country,
      ]
        .filter(Boolean)
        .join(", "),
    );
    // Auto-suggest VAT if we have one on file
    if (c.vat_id) setClientVat(c.vat_id);
    setClientPopoverOpen(false);
  }

  function clearClient() {
    setSelectedClient(null);
    setClientQuery("");
    setClientEmail("");
    setClientAddress("");
    setClientVat("");
  }

  async function persistInvoice(status: "draft" | "sent"): Promise<Tables<"invoices"> | null> {
    if (!dbAuth || !user) {
      toast.error("Sign in to save invoices to your workspace.");
      return null;
    }
    if (!clientQuery.trim()) {
      toast.error("Please add a client.");
      return null;
    }
    if (computed.base <= 0) {
      toast.error(mode === "fixed" ? "Enter a fixed amount." : "Enter hourly rate and hours.");
      return null;
    }

    setSaving(true);
    try {
      // Upsert client if it's a new name
      let clientId = selectedClient?.id ?? null;
      if (!clientId && clientQuery.trim()) {
        const { data: newClient, error: cErr } = await supabase
          .from("clients")
          .insert({
            owner_id: user.id,
            name: clientQuery.trim(),
            email: clientEmail || null,
            vat_id: clientVat || null,
            address_line1: clientAddress || null,
          })
          .select()
          .single();
        if (cErr) {
          console.warn("[client insert] failed", cErr);
        } else if (newClient) {
          clientId = newClient.id;
          setClients((prev) => [newClient, ...prev]);
          setSelectedClient(newClient);
        }
      }

      const payload = {
        owner_id: user.id,
        number,
        status,
        mode,
        client_id: clientId,
        client_name: clientQuery.trim(),
        client_email: clientEmail || null,
        client_address: clientAddress || null,
        client_vat_id: clientVat || null,
        summary: summary.trim() || null,
        fixed_amount: mode === "fixed" ? computed.base : 0,
        hourly_rate: mode === "hourly" ? hourlyRate : 0,
        hours: mode === "hourly" ? hours : 0,
        surcharge_night_pct: night ? nightPct : 0,
        surcharge_weekend_pct: weekend ? weekendPct : 0,
        surcharge_holiday_pct: holiday ? holidayPct : 0,
        vat_rate: vatRate,
        subtotal: computed.base,
        surcharge_total: computed.surchargeTotal,
        net_total: computed.net,
        vat_amount: computed.vat,
        gross_total: computed.gross,
        line_items: computed.items as unknown as Tables<"invoices">["line_items"],
        sent_at: status === "sent" ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase.from("invoices").insert(payload).select().single();
      if (error) throw error;
      toast.success(status === "sent" ? "Invoice sent & saved." : "Draft saved.");
      // Reset invoice number for the next one
      setNumber(nextInvoiceNumber());
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save invoice.";
      console.error("[invoice save] failed", err);
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    await persistInvoice("draft");
  }

  async function handleSend() {
    const inv = await persistInvoice("sent");
    if (!inv) return;
    // Best-effort mailto trigger (email provider hook can plug in here later).
    if (clientEmail) {
      const subject = encodeURIComponent(`Invoice ${inv.number}`);
      const body = encodeURIComponent(
        `Hi ${inv.client_name},\n\n${summary}\n\nNet: ${formatEUR(computed.net)}\nVAT (${vatRate}%): ${formatEUR(
          computed.vat,
        )}\nTotal: ${formatEUR(computed.gross)}\n\nThank you!`,
      );
      window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    }
  }

  function openPrintPreview() {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      toast.error("Pop-up blocked — please allow pop-ups.");
      return;
    }
    const today = new Date().toLocaleDateString();
    const rows = computed.items
      .map(
        (it) =>
          `<tr><td>${it.label.replace(/</g, "&lt;")}</td><td style="text-align:right">${it.qty} ${it.unit}</td><td style="text-align:right">${formatEUR(it.price)}</td><td style="text-align:right">${formatEUR(it.qty * it.price)}</td></tr>`,
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>${number}</title><meta charset="utf-8"/>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;padding:48px;max-width:760px;margin:auto}
        h1{font-size:28px;margin:0 0 4px;letter-spacing:-.02em}
        .muted{color:#64748b;font-size:13px}
        .row{display:flex;justify-content:space-between;gap:24px;margin-top:32px}
        .card{border:1px solid #e2e8f0;border-radius:12px;padding:16px}
        table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
        th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}
        .total{font-size:20px;font-weight:800}
        .brand{color:#ea580c;font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:12px}
      </style></head><body>
      <div class="brand">Invoice</div>
      <h1>${number}</h1>
      <div class="muted">Issued ${today}</div>
      <div class="row">
        <div class="card" style="flex:1"><div class="muted">Billed to</div><strong>${clientQuery || "—"}</strong><div class="muted">${clientAddress || ""}</div><div class="muted">${clientVat ? "VAT " + clientVat : ""}</div></div>
        <div class="card" style="flex:1"><div class="muted">Payment</div>Due within 14 days</div>
      </div>
      <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="row" style="justify-content:flex-end"><div style="min-width:280px">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatEUR(computed.base)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Surcharges</span><span>${formatEUR(computed.surchargeTotal)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Net</span><span>${formatEUR(computed.net)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>VAT ${vatRate}%</span><span>${formatEUR(computed.vat)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px" class="total"><span>Total</span><span>${formatEUR(computed.gross)}</span></div>
      </div></div>
      <p class="muted" style="margin-top:48px">Thank you for your business.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <section
      id="pro-voice-invoice"
      className="mx-2 mt-6 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-white">Voice-to-Invoice</h3>
          <p className="text-xs text-slate-400">
            Dictate the job, pick a client, apply surcharges & VAT, save or send.
          </p>
        </div>
        {!dbAuth && (
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Sign in to save
          </span>
        )}
      </div>

      {/* Mode + Number */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger className="intake-input mt-1.5 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Invoice number
          </Label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="intake-input mt-1.5 h-10"
          />
        </div>
      </div>

      {/* Client picker */}
      <div className="mt-3">
        <Label className="text-[11px] uppercase tracking-wider text-slate-400">Client</Label>
        <div className="mt-1.5 flex gap-2">
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={clientQuery}
                  onChange={(e) => {
                    setClientQuery(e.target.value);
                    setSelectedClient(null);
                    setClientPopoverOpen(true);
                  }}
                  onFocus={() => setClientPopoverOpen(true)}
                  placeholder="Search saved clients or type a new name…"
                  className="intake-input h-10 pl-9"
                />
                {clientQuery && (
                  <button
                    type="button"
                    onClick={clearClient}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-white/10"
                    aria-label="Clear client"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
              <div className="max-h-64 overflow-y-auto py-1">
                {!dbAuth && (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    Sign in to load saved clients.
                  </div>
                )}
                {dbAuth && filteredClients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    No matches — press enter to create a new client on save.
                  </div>
                )}
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[c.email, c.city].filter(Boolean).join(" · ") || "No details"}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Input
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Client email"
            className="intake-input h-10"
          />
          <Input
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            placeholder="Address"
            className="intake-input h-10 sm:col-span-1"
          />
          <Input
            value={clientVat}
            onChange={(e) => setClientVat(e.target.value)}
            placeholder="VAT ID (auto-suggested)"
            className="intake-input h-10"
          />
        </div>
      </div>

      {/* Job summary + dictation */}
      <div className="mt-3">
        <Label className="text-[11px] uppercase tracking-wider text-slate-400">Job summary</Label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. Küchensiphon getauscht, Unterschrank abgedichtet…"
          className="intake-input mt-1.5 min-h-[100px]"
        />
        <div className="mt-2 flex items-center gap-2">
          <VoiceDictateButton
            onAppend={(t) => setSummary((s) => (s ? `${s} ${t}` : t))}
            label="Dictate (DE)"
            lang="de-DE"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {mode === "fixed" ? (
          <div className="sm:col-span-2">
            <Label className="text-[11px] uppercase tracking-wider text-slate-400">
              Fixed amount (net €)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={fixedAmount || ""}
              onChange={(e) => setFixedAmount(Number(e.target.value) || 0)}
              className="intake-input mt-1.5 h-10"
            />
          </div>
        ) : (
          <>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                Hourly rate (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={hourlyRate || ""}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                className="intake-input mt-1.5 h-10"
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-slate-400">Hours</Label>
              <Input
                type="number"
                step="0.25"
                value={hours || ""}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                className="intake-input mt-1.5 h-10"
              />
            </div>
          </>
        )}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">VAT %</Label>
          <Select value={String(vatRate)} onValueChange={(v) => setVatRate(Number(v))}>
            <SelectTrigger className="intake-input mt-1.5 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (Kleinunternehmer)</SelectItem>
              <SelectItem value="7">7%</SelectItem>
              <SelectItem value="19">19% (Standard)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Surcharges */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          Surcharges
        </div>
        <SurchargeRow
          label="Night"
          active={night}
          onToggle={setNight}
          pct={nightPct}
          onPct={setNightPct}
        />
        <SurchargeRow
          label="Weekend"
          active={weekend}
          onToggle={setWeekend}
          pct={weekendPct}
          onPct={setWeekendPct}
        />
        <SurchargeRow
          label="Holiday"
          active={holiday}
          onToggle={setHoliday}
          pct={holidayPct}
          onPct={setHolidayPct}
        />
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-1 rounded-xl bg-white/[0.03] p-3 text-xs text-slate-300">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatEUR(computed.base)}</span>
        </div>
        <div className="flex justify-between">
          <span>Surcharges</span>
          <span>{formatEUR(computed.surchargeTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Net</span>
          <span>{formatEUR(computed.net)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT ({vatRate}%)</span>
          <span>{formatEUR(computed.vat)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-white">
          <span>Total</span>
          <span>{formatEUR(computed.gross)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          className="h-10 rounded-full border-white/20 bg-white/[0.04] px-4 text-xs text-white hover:bg-white/10"
        >
          <Sparkles className="mr-1.5 size-4" /> Preview Invoice
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={openPrintPreview}
          className="h-10 rounded-full border-white/20 bg-white/[0.04] px-4 text-xs text-white hover:bg-white/10"
        >
          <Printer className="mr-1.5 size-4" /> Print / PDF
        </Button>
        <Button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || !dbAuth}
          className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
        >
          <Save className="mr-1.5 size-4" /> Save Draft
        </Button>
        <Button
          type="button"
          onClick={handleSend}
          disabled={saving || !dbAuth}
          className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
        >
          <Send className="mr-1.5 size-4" /> Send Invoice
        </Button>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice preview — {number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Billed to
              </div>
              <div className="font-medium">{clientQuery || "—"}</div>
              <div className="text-xs text-muted-foreground">{clientAddress}</div>
              {clientVat && <div className="text-xs text-muted-foreground">VAT {clientVat}</div>}
            </div>
            <div className="rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit €</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{it.label}</td>
                      <td className="p-2 text-right">{it.qty}</td>
                      <td className="p-2 text-right">{formatEUR(it.price)}</td>
                      <td className="p-2 text-right">{formatEUR(it.qty * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Net</span>
                <span>{formatEUR(computed.net)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({vatRate}%)</span>
                <span>{formatEUR(computed.vat)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>{formatEUR(computed.gross)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={openPrintPreview}>
              <Printer className="mr-1.5 size-4" />
              Print / PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SurchargeRow({
  label,
  active,
  onToggle,
  pct,
  onPct,
}: {
  label: string;
  active: boolean;
  onToggle: (v: boolean) => void;
  pct: number;
  onPct: (v: number) => void;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-1.5", !active && "opacity-70")}>
      <Switch checked={active} onCheckedChange={onToggle} />
      <span className="w-20 text-xs text-slate-300">{label}</span>
      <Input
        type="number"
        value={pct}
        onChange={(e) => onPct(Number(e.target.value) || 0)}
        disabled={!active}
        className="intake-input h-8 w-20"
      />
      <span className="text-xs text-slate-500">%</span>
    </div>
  );
}
