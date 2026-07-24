import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FieldLabel, ModalShell, inputCls } from "./ModalShell";
import { KEYS, readJSON, writeJSON, type PayoutState } from "./types";

// Minimal German BLZ → (BIC, bank name) map for auto-suggest.
const GERMAN_BANKS: Record<string, { bic: string; name: string }> = {
  "10010010": { bic: "PBNKDEFF", name: "Postbank" },
  "10070000": { bic: "DEUTDEBBXXX", name: "Deutsche Bank" },
  "10070024": { bic: "DEUTDEDBBER", name: "Deutsche Bank" },
  "10080000": { bic: "DRESDEFF100", name: "Commerzbank (ehem. Dresdner)" },
  "20050550": { bic: "HASPDEHHXXX", name: "Hamburger Sparkasse" },
  "20070000": { bic: "DEUTDEHHXXX", name: "Deutsche Bank Hamburg" },
  "25010030": { bic: "PBNKDEFF250", name: "Postbank Hannover" },
  "30070010": { bic: "DEUTDEDDXXX", name: "Deutsche Bank Düsseldorf" },
  "37040044": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "37050198": { bic: "COKSDE33XXX", name: "Sparkasse KölnBonn" },
  "50010517": { bic: "INGDDEFFXXX", name: "ING-DiBa" },
  "50050201": { bic: "HELADEF1822", name: "Frankfurter Sparkasse" },
  "50070010": { bic: "DEUTDEFFXXX", name: "Deutsche Bank Frankfurt" },
  "50070024": { bic: "DEUTDEDBFRA", name: "Deutsche Bank" },
  "60050101": { bic: "SOLADEST600", name: "LBBW / BW-Bank" },
  "60090100": { bic: "GENODEF1S02", name: "BW-Bank / SW-Bank" },
  "70010080": { bic: "PBNKDEFFXXX", name: "Postbank München" },
  "70020270": { bic: "HYVEDEMMXXX", name: "HypoVereinsbank" },
  "70150000": { bic: "SSKMDEMMXXX", name: "Stadtsparkasse München" },
  "76026000": { bic: "NORSDE71XXX", name: "Norisbank" },
  "12030000": { bic: "BYLADEM1001", name: "Deutsche Kreditbank (DKB)" },
  "43060967": { bic: "GENODEM1GLS", name: "GLS Bank" },
  "50130400": { bic: "SXPYDEHH", name: "N26 Bank" },
};

function formatIban(raw: string): string {
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

function ibanChecksumValid(raw: string): boolean {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString());
  let rem = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    rem = Number(String(rem) + numeric.slice(i, i + 7)) % 97;
  }
  return rem === 1;
}

function validateGermanIban(raw: string): {
  ok: boolean;
  reason?: string;
  blz?: string;
} {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  if (!s) return { ok: false };
  if (!/^DE/.test(s)) return { ok: false, reason: "Must start with DE" };
  if (s.length !== 22)
    return { ok: false, reason: `German IBAN must be 22 characters (got ${s.length})` };
  if (!/^DE\d{20}$/.test(s)) return { ok: false, reason: "Only digits after DE" };
  if (!ibanChecksumValid(s))
    return { ok: false, reason: "Checksum doesn't match — please re-check" };
  return { ok: true, blz: s.slice(4, 12) };
}

export function PayoutModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const current = readJSON<PayoutState>(KEYS.payout);
  const [holder, setHolder] = useState(current?.holder ?? "");
  const [iban, setIban] = useState(current?.iban ? formatIban(current.iban) : "");
  const [bic, setBic] = useState(current?.bic ?? "");
  const [bank, setBank] = useState(current?.bank ?? "");
  const [bicTouched, setBicTouched] = useState(Boolean(current?.bic));
  const [bankTouched, setBankTouched] = useState(Boolean(current?.bank));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSavedAt(null);
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("bank_account_holder, bank_iban, bank_bic, bank_name")
        .eq("id", uid)
        .maybeSingle();
      if (!data) return;
      if (data.bank_account_holder) setHolder(data.bank_account_holder);
      if (data.bank_iban) setIban(formatIban(data.bank_iban));
      if (data.bank_bic) {
        setBic(data.bank_bic);
        setBicTouched(true);
      }
      if (data.bank_name) {
        setBank(data.bank_name);
        setBankTouched(true);
      }
    })();
  }, [open]);

  const ibanCheck = useMemo(() => validateGermanIban(iban), [iban]);
  const suggested = ibanCheck.ok && ibanCheck.blz ? GERMAN_BANKS[ibanCheck.blz] : undefined;

  useEffect(() => {
    if (!suggested) return;
    if (!bicTouched) setBic(suggested.bic);
    if (!bankTouched) setBank(suggested.name);
  }, [suggested, bicTouched, bankTouched]);

  const bicValid = !bic || /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.trim().toUpperCase());

  const canSubmit = holder.trim().length >= 2 && ibanCheck.ok && bicValid && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ibanCheck.ok) {
      toast.error(ibanCheck.reason ?? "IBAN looks invalid");
      return;
    }
    if (!bicValid) {
      toast.error("BIC / SWIFT format looks invalid");
      return;
    }
    setSaving(true);
    const clean = iban.replace(/\s+/g, "").toUpperCase();
    const bicClean = bic.trim().toUpperCase() || undefined;
    writeJSON(KEYS.payout, { holder, iban: clean, bic: bicClean, bank });

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (uid) {
      const { error } = await supabase
        .from("profiles")
        .update({
          bank_account_holder: holder,
          bank_iban: clean,
          bank_bic: bicClean ?? null,
          bank_name: bank || null,
        })
        .eq("id", uid);
      if (error) {
        setSaving(false);
        toast.error(`Saved locally, but profile sync failed: ${error.message}`);
        return;
      }
    }
    setSaving(false);
    setSavedAt(Date.now());
    toast.success("Bank details saved successfully", {
      description: "Your invoices will now pre-fill with this account.",
    });
    setTimeout(() => onOpenChange(false), 1400);
  }

  const showSuccess = savedAt !== null;

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Landmark}
      title="Bank Details"
      subtitle="Primary Business Account — used for invoices and payroll."
    >
      {showSuccess ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <p className="text-base font-semibold text-white">Bank details saved successfully</p>
          <p className="max-w-xs text-xs text-white/55">
            Encrypted and stored to your company profile. New invoices will pre-fill with this
            account automatically.
          </p>
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange">
              <Landmark className="h-3 w-3" strokeWidth={2} />
              Primary Business Account
            </span>
          </div>

          <div className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.75} />
            <div className="space-y-1 text-xs text-white/75">
              <p className="font-semibold text-white/90">Why we need this</p>
              <p>
                This is the account we pre-fill on every invoice you send and will use later for
                payroll and staff reimbursements. Your details are{" "}
                <span className="font-semibold text-white/90">encrypted at rest</span> and only
                revealed to a homeowner{" "}
                <span className="font-semibold text-white/90">after they confirm a booking</span>{" "}
                with direct bank transfer — never shown publicly.
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <FieldLabel>Account holder</FieldLabel>
            <Input
              required
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Full legal name or company"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel>IBAN</FieldLabel>
              {iban && ibanCheck.ok && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                  Valid
                </span>
              )}
            </div>
            <Input
              required
              value={iban}
              onChange={(e) => setIban(formatIban(e.target.value))}
              placeholder="DE89 3704 0044 0532 0130 00"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              className={
                inputCls +
                " font-mono uppercase tracking-wider " +
                (iban && !ibanCheck.ok ? "border-red-400/40 focus-visible:ring-red-400/40" : "")
              }
            />
            {iban && !ibanCheck.ok && ibanCheck.reason && (
              <span className="text-[11px] text-red-300/90">{ibanCheck.reason}</span>
            )}
            {suggested && !bicTouched && (
              <span className="text-[11px] text-white/50">
                Detected {suggested.name} · BIC auto-filled
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <FieldLabel>BIC / SWIFT</FieldLabel>
              <Input
                value={bic}
                onChange={(e) => {
                  setBicTouched(true);
                  setBic(e.target.value.toUpperCase());
                }}
                placeholder="COBADEFFXXX"
                className={
                  inputCls +
                  " font-mono uppercase " +
                  (bic && !bicValid ? "border-red-400/40 focus-visible:ring-red-400/40" : "")
                }
              />
              {bic && !bicValid && (
                <span className="text-[11px] text-red-300/90">Format: 8 or 11 letters/digits</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <FieldLabel>Bank name</FieldLabel>
              <Input
                value={bank}
                onChange={(e) => {
                  setBankTouched(true);
                  setBank(e.target.value);
                }}
                placeholder="Commerzbank"
                className={inputCls}
              />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-white/45">
            You can update these details anytime. This account will be used to pre-fill all your
            invoices.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={!canSubmit}>
              {saving ? "Saving…" : "Save details"}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
