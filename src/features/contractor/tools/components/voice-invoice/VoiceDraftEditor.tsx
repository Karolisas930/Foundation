/**
 * Draft editor panel — client selection, billing, surcharges, VAT, summary,
 * legal & company info, template upload, and primary action buttons.
 */
import {
  Building2,
  ChevronDown,
  Eye,
  FileText,
  Loader2,
  Mail,
  Percent,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  REQUIRED_LEGAL_KEYS,
  setInvoiceTemplateFile,
  updateCompanyLegalInfo,
  type CompanyLegalInfo,
} from "@/features/contractor/profile/components/toolbelt/invoice-store";
import { toast } from "sonner";
import { SummaryRow } from "../ToolbeltStyles";
import { SURCHARGE_META, fmtEur, type SurchargeKey, type VatMode } from "./voice-invoice-shared";
import type { VoiceInvoiceState } from "./useVoiceInvoice";

const LEGAL_FIELDS: Array<{ key: keyof CompanyLegalInfo; label: string; ph: string }> = [
  { key: "companyName", label: "Company name", ph: "Mustermann Handwerk" },
  { key: "address", label: "Address", ph: "Hauptstraße 42" },
  { key: "postalCode", label: "Postal code", ph: "70173" },
  { key: "city", label: "City", ph: "Stuttgart" },
  { key: "email", label: "Contact email", ph: "kontakt@example.de" },
  { key: "phone", label: "Contact phone", ph: "+49 …" },
  { key: "companyRegistration", label: "Company Reg. (HRB)", ph: "HRB 123456" },
  { key: "vatId", label: "USt-IdNr", ph: "DE123456789" },
  { key: "taxNumber", label: "Steuernummer", ph: "12/345/67890" },
  { key: "managingDirector", label: "Managing Director", ph: "Max Mustermann" },
  { key: "iban", label: "IBAN", ph: "DE00 0000 0000 0000 0000 00" },
  { key: "bic", label: "BIC", ph: "DEUTDEDBXXX" },
  { key: "bankName", label: "Bank name", ph: "Sparkasse" },
];

export function VoiceDraftEditor({ s }: { s: VoiceInvoiceState }) {
  return (
    <>
      {/* Client selection */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <Label className="flex items-center gap-2 text-white">
          <Users className="size-4 text-orange" strokeWidth={1.5} />
          Select Client from Marketplace
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={s.clientQuery}
            onChange={(e) => {
              s.setClientQuery(e.target.value);
              s.setShowClientList(true);
              if (s.clientId) s.setClientId("");
            }}
            onFocus={() => s.setShowClientList(true)}
            placeholder="Search marketplace clients (name, city, postcode)…"
            className="intake-input pl-9"
          />
          {s.showClientList && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0f172a] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50">
                <span>
                  {s.filteredClients.length} match{s.filteredClients.length === 1 ? "" : "es"}
                </span>
                <button
                  type="button"
                  onClick={() => s.setShowClientList(false)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-white/60 hover:bg-white/5 hover:text-white"
                  aria-label="Close results"
                >
                  <X className="size-3" strokeWidth={1.75} /> Close
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {s.filteredClients.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-white/50">No matches</div>
                ) : (
                  s.filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => s.applyClient(c)}
                      className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-white/5"
                    >
                      <div>
                        <div className="text-sm text-white">{c.name}</div>
                        <div className="text-[11px] text-white/50">
                          {[c.street, c.postcode, c.city].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          c.type === "private"
                            ? "border-emerald-400/30 text-emerald-300"
                            : c.type === "business"
                              ? "border-sky-400/30 text-sky-300"
                              : "border-orange/40 text-orange",
                        )}
                      >
                        {c.type === "eu_business" ? "EU B2B" : c.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {!s.manualAddress && !s.clientId && (
          <button
            type="button"
            onClick={() => {
              s.setManualAddress(true);
              s.setShowClientList(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-medium text-white/80 hover:border-orange/50 hover:text-orange"
          >
            <Plus className="size-3.5" strokeWidth={1.75} /> Add manually
          </button>
        )}

        {(s.manualAddress || s.clientId) && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] text-white/70">Client name</Label>
                <Input
                  value={s.clientName}
                  onChange={(e) => s.setClientName(e.target.value)}
                  placeholder="e.g. Familie Weber"
                  className="intake-input mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-white/70">Street</Label>
                <Input
                  value={s.clientStreet}
                  onChange={(e) => s.setClientStreet(e.target.value)}
                  placeholder="Hauptstraße 42"
                  className="intake-input mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-white/70">Postcode</Label>
                <Input
                  value={s.clientPostcode}
                  onChange={(e) => s.setClientPostcode(e.target.value)}
                  placeholder="70173"
                  className="intake-input mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-white/70">City</Label>
                <Input
                  value={s.clientCity}
                  onChange={(e) => s.setClientCity(e.target.value)}
                  placeholder="Stuttgart"
                  className="intake-input mt-1"
                />
              </div>
            </div>
            {s.manualAddress && (
              <button
                type="button"
                onClick={() => {
                  s.setManualAddress(false);
                  s.setClientId("");
                  s.setClientName("");
                  s.setClientStreet("");
                  s.setClientPostcode("");
                  s.setClientCity("");
                }}
                className="text-[11px] text-white/50 hover:text-orange"
              >
                Clear address fields
              </button>
            )}
          </div>
        )}
      </div>

      {/* Billing mode toggle */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm text-white">Billing mode</Label>
          <div
            role="tablist"
            aria-label="Billing mode"
            className="inline-flex rounded-full border border-white/10 bg-black/30 p-1"
          >
            {(
              [
                { key: "fixed", label: "Fixed Price" },
                { key: "hourly", label: "Hourly Rate" },
              ] as const
            ).map((m) => {
              const active = s.billingMode === m.key;
              return (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => s.setBillingMode(m.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-orange text-black shadow-[0_0_0_1px_rgba(255,138,0,0.6)]"
                      : "text-white/70 hover:text-white",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {s.billingMode === "fixed" ? (
          <div>
            <Label htmlFor="voice-amount" className="text-[12px] text-white/80">
              Amount (€)
            </Label>
            <Input
              id="voice-amount"
              inputMode="decimal"
              value={s.amountText}
              onChange={(e) => s.setAmountText(e.target.value)}
              placeholder="e.g. 850,00"
              className="intake-input mt-2"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="voice-hours" className="text-[12px] text-white/80">
                  Hours
                </Label>
                <Input
                  id="voice-hours"
                  inputMode="decimal"
                  value={s.hoursText}
                  onChange={(e) => s.setHoursText(e.target.value)}
                  placeholder="e.g. 14"
                  className="intake-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="voice-rate" className="text-[12px] text-white/80">
                  Rate (€/h)
                </Label>
                <Input
                  id="voice-rate"
                  inputMode="decimal"
                  value={s.rateText}
                  onChange={(e) => s.setRateText(e.target.value)}
                  placeholder="e.g. 150"
                  className="intake-input mt-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
              <span className="text-white/60">
                {s.parsedHours > 0 && s.parsedRate > 0
                  ? `${s.parsedHours} h × ${fmtEur(s.parsedRate)}/h`
                  : "Enter hours and rate"}
              </span>
              <span className="font-semibold text-orange">{fmtEur(s.baseAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Surcharges */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm text-white">
            <Percent className="size-4 text-orange" strokeWidth={1.5} /> Surcharges
          </Label>
          {s.anySurcharge && (
            <span className="text-[11px] text-orange">
              +{s.surchargePct}% = {fmtEur(s.surchargeAmount)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SURCHARGE_META) as SurchargeKey[]).map((k) => {
            const meta = SURCHARGE_META[k];
            const active = s.surcharges[k];
            const Icon = meta.Icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => s.setSurcharges((prev) => ({ ...prev, [k]: !prev[k] }))}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-medium transition",
                  active
                    ? "border-orange/60 bg-orange/10 text-white"
                    : "border-white/10 bg-black/20 text-white/60 hover:border-orange/40",
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {meta.short}
              </button>
            );
          })}
        </div>
        <div>
          <Label className="text-[11px] text-white/70">Surcharge %</Label>
          <div className="relative mt-1">
            <Input
              inputMode="decimal"
              value={s.surchargePctText}
              onChange={(e) => {
                s.setSurchargePctText(e.target.value);
                s.setSurchargePctTouched(true);
              }}
              disabled={!s.anySurcharge}
              placeholder={s.anySurcharge ? "e.g. 25" : "Enable a surcharge to edit"}
              className="intake-input pr-8"
            />
            <Percent className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
          </div>
        </div>
      </div>

      {/* VAT */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-white">VAT</Label>
          {s.vatAutoLocked && s.vatMode !== "manual" && (
            <span className="text-[10px] text-emerald-300">Auto-suggested</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "19", label: "19%" },
              { key: "7", label: "7%" },
              { key: "0", label: "0% Reverse Charge" },
              { key: "manual", label: "Manual" },
            ] as const
          ).map((o) => {
            const active = s.vatMode === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  s.setVatMode(o.key as VatMode);
                  s.setVatAutoLocked(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-orange/60 bg-orange/15 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:border-orange/40",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {s.vatMode === "manual" && (
          <div className="relative">
            <Input
              inputMode="decimal"
              value={s.vatManualText}
              onChange={(e) => s.setVatManualText(e.target.value)}
              placeholder="Custom VAT %"
              className="intake-input pr-8"
            />
            <Percent className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
          </div>
        )}
      </div>

      {/* Draft summary */}
      <div className="space-y-2 rounded-2xl border border-orange/30 bg-gradient-to-b from-orange/[0.08] to-white/[0.02] p-4 text-sm">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-orange">
          <span>Invoice draft</span>
          <span>{s.billingMode === "hourly" ? "Hourly" : "Fixed"}</span>
        </div>
        {s.billingMode === "hourly" && (
          <SummaryRow
            label={
              s.parsedHours > 0 && s.parsedRate > 0
                ? `${s.parsedHours} h × ${fmtEur(s.parsedRate)}/h`
                : "Hours × Rate"
            }
            value={fmtEur(s.baseAmount)}
          />
        )}
        {s.billingMode === "fixed" && (
          <SummaryRow label="Base amount" value={fmtEur(s.baseAmount)} />
        )}
        {s.anySurcharge && (
          <SummaryRow
            label={`Surcharge (${(Object.keys(s.surcharges) as SurchargeKey[])
              .filter((k) => s.surcharges[k])
              .map((k) => SURCHARGE_META[k].short)
              .join(", ")}) +${s.surchargePct}%`}
            value={`+${fmtEur(s.surchargeAmount)}`}
            accent
          />
        )}
        <SummaryRow label="Net" value={fmtEur(s.netAmount)} />
        <SummaryRow
          label={s.vatMode === "0" ? "VAT 0% (Reverse Charge)" : `VAT ${s.vatRate}%`}
          value={fmtEur(s.vatAmount)}
        />
        <div className="mt-2 flex items-center justify-between border-t border-orange/20 pt-2 text-base font-bold">
          <span className="text-white">Total</span>
          <span className="text-orange">{fmtEur(s.totalGross)}</span>
        </div>
      </div>

      {/* Legal & company info editor */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => s.setShowLegal(!s.showLegal)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Building2 className="size-4 text-orange" strokeWidth={1.5} />
            Add / Edit Legal &amp; Company Information
          </span>
          <span className="flex items-center gap-2">
            {s.missing.length > 0 ? (
              <span className="rounded-full border border-orange/40 bg-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange">
                {s.missing.length} missing
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                Complete
              </span>
            )}
            <ChevronDown
              className={cn(
                "size-4 text-white/60 transition-transform",
                s.showLegal && "rotate-180",
              )}
              strokeWidth={1.5}
            />
          </span>
        </button>
        {s.showLegal && (
          <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
            {LEGAL_FIELDS.map(({ key, label, ph }) => {
              const required = REQUIRED_LEGAL_KEYS.some((r) => r.key === key);
              return (
                <div key={key}>
                  <Label htmlFor={`v2i-legal-${key}`} className="text-[11px] text-white/70">
                    {label}
                    {required && <span className="ml-1 text-orange">*</span>}
                  </Label>
                  <Input
                    id={`v2i-legal-${key}`}
                    value={(s.company[key] as string) ?? ""}
                    placeholder={ph}
                    onChange={(e) =>
                      updateCompanyLegalInfo({ [key]: e.target.value } as CompanyLegalInfo)
                    }
                    className="intake-input mt-1"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template upload */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          {s.templateFile ? (
            <FileText className="size-5 text-orange" strokeWidth={1.5} />
          ) : (
            <Upload className="size-5 text-orange" strokeWidth={1.5} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              {s.templateFile ? s.templateFile.name : "Upload custom invoice template"}
            </p>
            <p className="text-[11px] text-white/45">
              {s.templateFile
                ? `Custom template · ${(s.templateFile.size / 1024).toFixed(0)} KB`
                : "PDF, DOCX, PNG or JPG (max 5 MB). Auto-generated template is used if none is uploaded."}
            </p>
          </div>
          {s.templateFile && (
            <button
              type="button"
              onClick={() => {
                setInvoiceTemplateFile(null);
                toast.success("Reverted to auto-generated template.");
              }}
              className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-orange"
              aria-label="Remove custom template"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <input
          ref={s.templateInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => s.handleTemplateFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => s.templateInputRef.current?.click()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:border-orange/50 hover:text-orange"
        >
          <Upload className="h-4 w-4" strokeWidth={1.25} />
          {s.templateFile ? "Replace template" : "Upload template"}
        </button>
      </div>

      {s.missing.length > 0 && (
        <div className="rounded-xl border border-orange/30 bg-orange/10 p-3 text-[12px] text-orange">
          Company info incomplete — invoice will still save, but the generated template will miss{" "}
          {s.missing.length} legal field{s.missing.length === 1 ? "" : "s"}. Add them above in{" "}
          <span className="font-semibold">Legal &amp; Company Information</span>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={!s.transcript.trim() || s.baseAmount <= 0}
          onClick={() => s.setShowPreview(true)}
          className="h-11 w-full rounded-full border-white/20 font-semibold text-white hover:border-orange/60 hover:text-orange disabled:opacity-60"
        >
          <Eye className="mr-2 size-4" strokeWidth={1.5} /> Preview Invoice
        </Button>
        <Button
          type="button"
          disabled={!s.transcript.trim()}
          onClick={s.handleSave}
          className="btn-glow btn-glow-hover h-11 w-full rounded-full font-semibold disabled:opacity-60"
        >
          Save invoice draft
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <Label htmlFor="voice-send-email" className="flex items-center gap-2 text-white">
            <Mail className="size-4 text-orange" strokeWidth={1.5} />
            Send invoice to email
          </Label>
          <Input
            id="voice-send-email"
            type="email"
            inputMode="email"
            value={s.sendEmail}
            onChange={(e) => s.setSendEmail(e.target.value)}
            placeholder="kunde@example.de"
            className="intake-input mt-2"
          />
        </div>
        <Button
          type="button"
          disabled={s.sending || !s.transcript.trim() || s.baseAmount <= 0 || !s.emailValid}
          onClick={s.handleSend}
          variant="outline"
          className="h-11 w-full rounded-full border-orange/60 font-semibold text-orange hover:bg-orange/10 hover:text-orange disabled:opacity-60"
        >
          {s.sending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" strokeWidth={1.5} /> Send Invoice
            </>
          )}
        </Button>
      </div>
    </>
  );
}
