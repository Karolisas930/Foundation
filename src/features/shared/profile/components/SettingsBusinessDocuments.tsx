import { useRef, useState } from "react";
import {
  Building2,
  Check,
  CreditCard,
  FileText,
  Languages,
  Link as LinkIcon,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { extractVerification } from "@/lib/verification-ocr.functions";

import { SettingsVerificationUploadRow, type VerifRowState } from "./SettingsVerificationUploadRow";
import { LANGUAGES, type PersistedSettings, type SettingsUpdater } from "./settings-types";

type VerifKind = "meisterbrief" | "insurance";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function labelFor(kind: VerifKind) {
  return kind === "meisterbrief"
    ? "Meisterbrief / Handwerksrolle"
    : "Business Insurance certificate";
}

function unreadableCopy(kind: VerifKind) {
  return kind === "insurance"
    ? "We couldn't clearly read your Insurance Policy certificate. Please upload a clear, unblurred document."
    : "We couldn't clearly read your Meisterbrief / Handwerksrolle. Please upload a clear, unblurred document.";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function SettingsBusinessDocuments({
  s,
  update,
}: {
  s: PersistedSettings;
  update: SettingsUpdater;
}) {
  const [meisterState, setMeisterState] = useState<VerifRowState>({ status: "idle" });
  const [insuranceState, setInsuranceState] = useState<VerifRowState>({ status: "idle" });
  const meisterInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const runExtract = useServerFn(extractVerification);

  const [taxOpen, setTaxOpen] = useState(false);
  const [ibanOpen, setIbanOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === s.language) ?? LANGUAGES[0];

  async function onPickVerification(kind: VerifKind, file: File | undefined | null) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`${file.name} is over 10 MB — please compress and try again.`);
      return;
    }
    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
      toast.error(`${file.name}: only PDF or image files are accepted.`);
      return;
    }

    const setState = kind === "meisterbrief" ? setMeisterState : setInsuranceState;
    setState({ status: "extracting", fileName: file.name });

    try {
      const base64 = await fileToBase64(file);
      const result = await runExtract({
        data: {
          fileBase64: base64,
          mime: file.type,
          fileName: file.name,
          hint: kind,
        },
      });

      if (!result.ok) {
        setState({ status: "idle" });
        if (result.error === "unreadable") {
          toast.error(unreadableCopy(kind));
        } else {
          toast.error(`Could not process ${labelFor(kind)}: ${result.message ?? "unknown error"}`);
        }
        return;
      }

      const extraction = result.extraction as Record<string, unknown>;
      const summary =
        result.kind === "insurance"
          ? `${(extraction.providerName as string) || "Insurance"} · Policy ${(extraction.policyNumber as string) || "—"}`
          : `${(extraction.issuingChamber as string) || "Handwerkskammer"} · ${(extraction.trade as string) || "Trade"}`;

      setState({ status: "done", fileName: file.name, summary });
      toast.success(`${labelFor(kind)} uploaded`, {
        description: "AI extraction complete — status set to Pending review.",
      });
    } catch (err) {
      console.error("[verification upload]", err);
      setState({ status: "idle" });
      toast.error(err instanceof Error ? err.message : `Upload failed for ${labelFor(kind)}.`);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-transparent p-4 sm:p-5 space-y-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.3] blueprint-grid mix-blend-screen"
          aria-hidden
        />
        <div className="relative space-y-4">
          <h4 className="flex items-center gap-2 px-1 pt-1 font-semibold text-white">
            <Building2 className="size-5 text-orange" /> Business Documents &amp; Information
          </h4>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Legal Form / Rechtsform</label>
              <Select value={s.rechtsform} onValueChange={(v) => update("rechtsform", v)}>
                <SelectTrigger className="h-12 w-full border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Select legal form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzelunternehmer">Einzelunternehmer</SelectItem>
                  <SelectItem value="gbr">GbR</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ug">UG (haftungsbeschränkt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="min-w-0">
                <p className="font-semibold text-white">Small Business Regulation</p>
                <p className="text-xs text-slate-400">
                  § 19 UStG / Kleinunternehmer — no VAT on invoices
                </p>
              </div>
              <Switch
                checked={s.kleinunternehmer}
                onCheckedChange={(v) => update("kleinunternehmer", v)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <SettingsVerificationUploadRow
              icon={Upload}
              title="Upload Meisterbrief / Handwerksrolle"
              state={meisterState}
              onClick={() => meisterInputRef.current?.click()}
            />
            <input
              ref={meisterInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                void onPickVerification("meisterbrief", e.target.files?.[0]);
                if (meisterInputRef.current) meisterInputRef.current.value = "";
              }}
            />

            <SettingsVerificationUploadRow
              icon={ShieldCheck}
              title="Upload Business Insurance (Betriebshaftpflicht)"
              state={insuranceState}
              onClick={() => insuranceInputRef.current?.click()}
            />
            <input
              ref={insuranceInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                void onPickVerification("insurance", e.target.files?.[0]);
                if (insuranceInputRef.current) insuranceInputRef.current.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => setTaxOpen(true)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-4 text-left transition hover:border-orange/40 hover:bg-white/[0.06] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-orange" />
                <span className="truncate text-sm font-semibold text-white">
                  Tax ID (Steuernummer)
                </span>
              </span>
              <span className="max-w-[45%] shrink-0 truncate text-right text-xs text-slate-400">
                {s.steuernummer || "Not set"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIbanOpen(true)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-4 text-left transition hover:border-orange/40 hover:bg-white/[0.06] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <CreditCard className="size-5 shrink-0 text-orange" />
                <span className="truncate text-sm font-semibold text-white">
                  Bank Details (IBAN)
                </span>
              </span>
              <span className="max-w-[45%] shrink-0 truncate text-right text-xs text-slate-400">
                {s.iban ? `••••${s.iban.replace(/\s/g, "").slice(-4)}` : "Not set"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSocialOpen(true)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-4 text-left transition hover:border-orange/40 hover:bg-white/[0.06] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <LinkIcon className="size-5 shrink-0 text-orange" />
                <span className="truncate text-sm font-semibold text-white">
                  Social Media &amp; Website
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {s.website || s.socialInstagram || s.socialFacebook || s.socialLinkedin
                  ? "Configured"
                  : "Not set"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLanguageOpen(true)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-4 text-left transition hover:border-orange/40 hover:bg-white/[0.06] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Languages className="size-5 shrink-0 text-orange" />
                <span className="truncate text-sm font-semibold text-white">Language</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400 leading-none">
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="leading-none">{currentLang.label}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <Dialog open={taxOpen} onOpenChange={setTaxOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tax ID (Steuernummer)</DialogTitle>
            <DialogDescription>
              Your German tax number, shown on outgoing invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tax-id">Steuernummer</Label>
            <Input
              id="tax-id"
              value={s.steuernummer}
              onChange={(e) => update("steuernummer", e.target.value)}
              placeholder="z. B. 12/345/67890"
              inputMode="text"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                toast.success("Tax ID saved");
                setTaxOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ibanOpen} onOpenChange={setIbanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bank Details</DialogTitle>
            <DialogDescription>Used to pre-fill IBAN on invoices you send.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank-name">Bank name</Label>
              <Input
                id="bank-name"
                value={s.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                placeholder="e.g. Sparkasse Stuttgart"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={s.iban}
                onChange={(e) => update("iban", e.target.value.toUpperCase())}
                placeholder="DE00 0000 0000 0000 0000 00"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                toast.success("Bank details saved");
                setIbanOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={socialOpen} onOpenChange={setSocialOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Social Media &amp; Website</DialogTitle>
            <DialogDescription>Links shown on your public profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={s.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://your-site.de"
                inputMode="url"
                autoComplete="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={s.socialInstagram}
                onChange={(e) => update("socialInstagram", e.target.value)}
                placeholder="@handle or full URL"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={s.socialFacebook}
                onChange={(e) => update("socialFacebook", e.target.value)}
                placeholder="facebook.com/yourpage"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={s.socialLinkedin}
                onChange={(e) => update("socialLinkedin", e.target.value)}
                placeholder="linkedin.com/in/…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                toast.success("Social links saved");
                setSocialOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose language</DialogTitle>
            <DialogDescription>{LANGUAGES.length} languages available.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
            <ul className="divide-y divide-white/5">
              {LANGUAGES.map((lang) => {
                const active = lang.code === s.language;
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      onClick={() => {
                        update("language", lang.code);
                        try {
                          document.documentElement.lang = lang.code;
                          document.documentElement.dir =
                            lang.code === "ar" || lang.code === "he" ? "rtl" : "ltr";
                        } catch {
                          /* noop */
                        }
                        toast.success(`Language: ${lang.label}`);
                        setLanguageOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-white/5 rounded-md"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl leading-none">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.label}</span>
                        <span className="text-xs text-slate-500 uppercase">{lang.code}</span>
                      </span>
                      {active && <Check className="size-4 text-orange" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
