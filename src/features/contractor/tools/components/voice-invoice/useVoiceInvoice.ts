/**
 * useVoiceInvoice — owns all state, refs, effects and action handlers for
 * the Voice-to-Invoice flow. Subcomponents receive a stable state bag.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  addInvoice,
  missingLegalFields,
  setInvoiceTemplateFile,
  useCompanyLegalInfo,
  useInvoiceTemplateFile,
} from "@/features/contractor/profile/components/toolbelt/invoice-store";
import { sendPrivateInvoice } from "@/features/contractor/profile/private-invoice.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTemplateContext,
  compileInvoiceFromTemplate,
  downloadBlob,
} from "@/features/contractor/profile/components/toolbelt/template-merge";
import {
  MARKETPLACE_CLIENTS,
  suggestVatRateForClient,
  type MarketplaceClient,
} from "@/features/contractor/profile/components/toolbelt/marketplace-clients";
import {
  SURCHARGE_DEFAULTS,
  SURCHARGE_META,
  fmtEur,
  type SpeechRecInstance,
  type SpeechRecognitionCtor,
  type SurchargeKey,
  type VatMode,
} from "./voice-invoice-shared";

export function useVoiceInvoice(open: boolean, onOpenChange: (o: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typedIdx, setTypedIdx] = useState(0);

  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientPostcode, setClientPostcode] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [billingMode, setBillingMode] = useState<"fixed" | "hourly">("fixed");
  const [amountText, setAmountText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [rateText, setRateText] = useState("");

  const [surcharges, setSurcharges] = useState<Record<SurchargeKey, boolean>>({
    night: false,
    weekend: false,
    holiday: false,
  });
  const [surchargePctText, setSurchargePctText] = useState("");
  const [surchargePctTouched, setSurchargePctTouched] = useState(false);

  const [vatMode, setVatMode] = useState<VatMode>("19");
  const [vatManualText, setVatManualText] = useState("");
  const [vatAutoLocked, setVatAutoLocked] = useState(false);

  const [sendEmail, setSendEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const recRef = useRef<SpeechRecInstance | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const company = useCompanyLegalInfo();
  const templateFile = useInvoiceTemplateFile();
  const missing = useMemo(() => missingLegalFields(company), [company]);
  const sendInvoiceFn = useServerFn(sendPrivateInvoice);

  useEffect(() => {
    if (typedIdx >= transcript.length) return;
    const t = setTimeout(() => setTypedIdx((i) => Math.min(i + 2, transcript.length)), 25);
    return () => clearTimeout(t);
  }, [typedIdx, transcript]);

  function start() {
    const W = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Rec = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Rec) {
      toast.info("Speech recognition unavailable — you can type your quote below.");
      const demo = "14 hours plastering at 150 euro per hour with night work.";
      setTranscript(demo);
      setTypedIdx(0);
      return;
    }
    const rec = new Rec();
    rec.lang = "en-GB";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (ev) => {
      let full = "";
      for (let i = 0; i < ev.results.length; i++) full += ev.results[i][0].transcript;
      setTranscript(full);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
    setTranscript("");
    setTypedIdx(0);
  }
  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  useEffect(() => {
    if (!open) {
      stop();
      setTranscript("");
      setTypedIdx(0);
      setClientId("");
      setClientName("");
      setClientStreet("");
      setClientPostcode("");
      setClientCity("");
      setClientQuery("");
      setShowClientList(false);
      setManualAddress(false);
      setShowPreview(false);
      setAmountText("");
      setBillingMode("fixed");
      setHoursText("");
      setRateText("");
      setSurcharges({ night: false, weekend: false, holiday: false });
      setSurchargePctText("");
      setSurchargePctTouched(false);
      setVatMode("19");
      setVatManualText("");
      setVatAutoLocked(false);
      setSendEmail("");
      setSending(false);
      setShowLegal(false);
    }
  }, [open]);

  const normaliseNumber = (raw: string) => {
    const n = Number(
      raw
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", "."),
    );
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const parsedHours = useMemo(() => normaliseNumber(hoursText), [hoursText]);
  const parsedRate = useMemo(() => normaliseNumber(rateText), [rateText]);
  const baseAmount = useMemo(() => {
    if (billingMode === "hourly") return Math.round(parsedHours * parsedRate * 100) / 100;
    return normaliseNumber(amountText);
  }, [billingMode, amountText, parsedHours, parsedRate]);

  const anySurcharge = surcharges.night || surcharges.weekend || surcharges.holiday;
  const surchargePct = useMemo(() => {
    if (surchargePctText.trim()) return normaliseNumber(surchargePctText);
    if (surcharges.holiday) return SURCHARGE_DEFAULTS.holiday;
    if (surcharges.weekend) return SURCHARGE_DEFAULTS.weekend;
    if (surcharges.night) return SURCHARGE_DEFAULTS.night;
    return 0;
  }, [surchargePctText, surcharges]);
  const surchargeAmount = useMemo(
    () => (anySurcharge ? Math.round(((baseAmount * surchargePct) / 100) * 100) / 100 : 0),
    [anySurcharge, baseAmount, surchargePct],
  );
  const netAmount = useMemo(
    () => Math.round((baseAmount + surchargeAmount) * 100) / 100,
    [baseAmount, surchargeAmount],
  );

  const vatRate = useMemo(() => {
    if (vatMode === "manual") return normaliseNumber(vatManualText);
    return Number(vatMode);
  }, [vatMode, vatManualText]);
  const vatAmount = useMemo(
    () => Math.round(((netAmount * vatRate) / 100) * 100) / 100,
    [netAmount, vatRate],
  );
  const totalGross = useMemo(
    () => Math.round((netAmount + vatAmount) * 100) / 100,
    [netAmount, vatAmount],
  );

  useEffect(() => {
    if (surchargePctTouched) return;
    if (surcharges.holiday) setSurchargePctText(String(SURCHARGE_DEFAULTS.holiday));
    else if (surcharges.weekend) setSurchargePctText(String(SURCHARGE_DEFAULTS.weekend));
    else if (surcharges.night) setSurchargePctText(String(SURCHARGE_DEFAULTS.night));
    else setSurchargePctText("");
  }, [surcharges, surchargePctTouched]);

  const handleTemplateFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Template too large — 5 MB max.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceTemplateFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: Date.now(),
      });
      toast.success("Custom invoice template uploaded.");
    };
    reader.onerror = () => toast.error("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendEmail.trim());

  function applyClient(c: MarketplaceClient) {
    setClientId(c.id);
    setClientName(c.name);
    setClientStreet(c.street ?? "");
    setClientPostcode(c.postcode ?? "");
    setClientCity(c.city ?? "");
    setClientQuery(c.name);
    setShowClientList(false);
    setManualAddress(true);
    if (c.email && !sendEmail) setSendEmail(c.email);
    if (vatMode !== "manual") {
      const suggested = suggestVatRateForClient(c);
      setVatMode(String(suggested) as VatMode);
      setVatAutoLocked(true);
      toast.success(
        `Client loaded — VAT auto-set to ${suggested}%${suggested === 0 ? " (Reverse Charge)" : ""}.`,
      );
    } else {
      toast.success("Client loaded from marketplace.");
    }
  }

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return MARKETPLACE_CLIENTS;
    return MARKETPLACE_CLIENTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.postcode?.toLowerCase().includes(q),
    );
  }, [clientQuery]);

  useEffect(() => {
    if (!transcript.trim()) return;
    const text = transcript;
    const lower = text.toLowerCase();
    const NUM = String.raw`\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;

    const hourly = text.match(
      new RegExp(
        String.raw`(${NUM})\s*(?:h|hr|hrs|hour|hours|stunden|std)\b[\s\S]{0,60}?(?:at|@|for|zu|à|a|à|für)\s*(?:€\s*)?(${NUM})\s*(?:€|eur|euro|euros)?\s*(?:\/|per|pro|an)\s*(?:h|hr|hour|stunde)`,
        "i",
      ),
    );
    if (hourly) {
      setBillingMode("hourly");
      if (!hoursText.trim()) setHoursText(hourly[1]);
      if (!rateText.trim()) setRateText(hourly[2]);
    } else {
      const rateOnly = text.match(
        new RegExp(
          String.raw`(?:€\s*)?(${NUM})\s*(?:€|eur|euro|euros)?\s*(?:\/|per|pro)\s*(?:h|hr|hour|stunde)`,
          "i",
        ),
      );
      if (rateOnly) {
        setBillingMode("hourly");
        if (!rateText.trim()) setRateText(rateOnly[1]);
      } else if (billingMode === "fixed" && !amountText.trim()) {
        const match = text.match(
          new RegExp(String.raw`(?:€\s*)?(${NUM})\s*(?:€|eur|euro|euros)`, "i"),
        );
        if (match) setAmountText(match[1]);
      }
    }

    const patchS: Partial<Record<SurchargeKey, boolean>> = {};
    if (/\b(night(\s*work)?|nachtarbeit|nachts|at night)\b/i.test(lower)) patchS.night = true;
    if (/\b(sunday|weekend|samstag|sonntag|wochenende|on saturday|on sunday)\b/i.test(lower))
      patchS.weekend = true;
    if (/\b(holiday|public holiday|feiertag|bank holiday)\b/i.test(lower)) patchS.holiday = true;
    if (Object.keys(patchS).length > 0) {
      setSurcharges((prev) => ({ ...prev, ...patchS }));
    }

    const pctMatch = text.match(
      new RegExp(String.raw`(${NUM})\s*%\s*(?:surcharge|zuschlag|extra)`, "i"),
    );
    if (pctMatch && !surchargePctTouched) {
      setSurchargePctText(pctMatch[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const buildDescription = () => {
    const parts: string[] = [];
    parts.push(`Billing: ${billingMode === "hourly" ? "Hourly" : "Fixed price"}`);
    if (billingMode === "hourly" && parsedHours > 0 && parsedRate > 0) {
      parts.push(`${parsedHours}h × ${fmtEur(parsedRate)}/h = ${fmtEur(baseAmount)}`);
    } else {
      parts.push(`Base ${fmtEur(baseAmount)}`);
    }
    if (anySurcharge) {
      const active = (Object.keys(surcharges) as SurchargeKey[])
        .filter((k) => surcharges[k])
        .map((k) => SURCHARGE_META[k].short)
        .join(", ");
      parts.push(`Surcharge ${active} +${surchargePct}% = ${fmtEur(surchargeAmount)}`);
    }
    parts.push(`Net ${fmtEur(netAmount)} · VAT ${vatRate}% ${fmtEur(vatAmount)}`);
    parts.push(`Total ${fmtEur(totalGross)}`);
    const summary = parts.join(" · ");
    return `${transcript.trim()}\n[${summary}]`.slice(0, 500);
  };

  const validateAmount = () => {
    if (baseAmount <= 0) {
      toast.error(
        billingMode === "hourly"
          ? "Enter valid hours and hourly rate."
          : "Enter a valid amount before saving.",
      );
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!transcript.trim()) {
      toast.error("Dictate or type the quote first.");
      return;
    }
    if (!validateAmount()) return;
    if (!emailValid) {
      toast.error("Enter a valid recipient email.");
      return;
    }
    if (!company.email?.trim()) {
      setShowLegal(true);
      toast.info(
        "Sender email not configured — please add your contact email in Legal & Company Information.",
      );
      setTimeout(() => {
        document
          .getElementById("v2i-legal-email")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        (document.getElementById("v2i-legal-email") as HTMLInputElement | null)?.focus();
      }, 150);
      return;
    }
    setSending(true);
    const toastId = toast.loading("Sending invoice…");
    try {
      const result = await sendInvoiceFn({
        data: {
          clientEmail: sendEmail.trim(),
          clientName: clientName.trim() || "Kunde",
          laborAmount: totalGross,
          materialAmount: 0,
          contractorName: company.companyName?.trim() || "Ihr Handwerker",
        },
      });
      addInvoice({
        date: new Date().toISOString().slice(0, 10),
        client: clientName.trim() || sendEmail.trim(),
        description: buildDescription(),
        amount: totalGross,
        status: "sent",
      });
      toast.dismiss(toastId);
      toast.success(
        result.provider === "resend"
          ? `Invoice sent to ${sendEmail.trim()}`
          : "Invoice prepared (email relay not configured).",
      );
      onOpenChange(false);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Could not send invoice.");
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    if (!validateAmount()) return;
    const today = new Date().toISOString().slice(0, 10);
    const invoiceNumber = `${today.replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const laborAmount = totalGross;
    const materialAmount = 0;
    const description = buildDescription();
    const entry = addInvoice({
      date: today,
      client: clientName.trim() || "Unnamed client",
      description,
      amount: totalGross,
      status: "draft",
    });

    try {
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id;
      if (!ownerId) {
        toast.error("Sign in to save invoice drafts to your account.");
      } else {
        const clientAddress =
          [clientStreet, clientPostcode, clientCity].filter((s) => s && s.trim()).join(", ") ||
          null;
        const { error: insertErr } = await supabase.from("invoices").insert({
          owner_id: ownerId,
          number: invoiceNumber,
          status: "draft",
          mode: billingMode,
          client_id: clientId || null,
          client_name: clientName.trim() || "Unnamed client",
          client_address: clientAddress,
          client_email: sendEmail.trim() || null,
          currency: "EUR",
          fixed_amount: billingMode === "fixed" ? normaliseNumber(amountText) : null,
          hours: billingMode === "hourly" ? parsedHours : null,
          hourly_rate: billingMode === "hourly" ? parsedRate : null,
          subtotal: baseAmount,
          surcharge_night_pct: surcharges.night ? surchargePct : null,
          surcharge_weekend_pct: surcharges.weekend ? surchargePct : null,
          surcharge_holiday_pct: surcharges.holiday ? surchargePct : null,
          surcharge_total: surchargeAmount,
          net_total: netAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          gross_total: totalGross,
          summary: description.slice(0, 500),
          line_items: [
            {
              description,
              quantity: billingMode === "hourly" ? parsedHours : 1,
              unit_price: billingMode === "hourly" ? parsedRate : baseAmount,
              total: baseAmount,
            },
          ],
          issued_at: today,
        });
        if (insertErr) {
          console.error("Invoice insert failed", insertErr);
          toast.error(`Could not save to database: ${insertErr.message}`);
        }
      }
    } catch (err) {
      console.error("Invoice insert threw", err);
    }

    if (templateFile) {
      const toastId = toast.loading("Merging custom template…");
      try {
        const ctx = buildTemplateContext({
          company,
          clientName: clientName.trim() || "Unnamed client",
          description,
          laborAmount,
          materialAmount,
          invoiceNumber,
          invoiceDate: today,
        });
        const compiled = await compileInvoiceFromTemplate(templateFile, ctx);
        downloadBlob(compiled.pdfBlob, compiled.filename);
        if (compiled.mergedDocxBlob && compiled.mergedDocxFilename) {
          downloadBlob(compiled.mergedDocxBlob, compiled.mergedDocxFilename);
        }
        toast.dismiss(toastId);
        toast.success(
          compiled.tagsFound.length > 0
            ? `Draft saved. Merged ${compiled.tagsFound.length} placeholder${
                compiled.tagsFound.length === 1 ? "" : "s"
              } into ${templateFile.name}.`
            : `Draft saved. Rendered PDF using ${templateFile.name}.`,
        );
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(
          err instanceof Error ? `Template merge failed: ${err.message}` : "Template merge failed.",
        );
      }
      onOpenChange(false);
      return;
    }

    toast.success(
      missing.length > 0
        ? "Draft saved. Complete company info in Legal & Company Information for a legal template."
        : "Draft invoice saved.",
    );
    void entry;
    onOpenChange(false);
  };

  return {
    // state
    listening,
    transcript,
    typedIdx,
    clientId,
    clientName,
    clientStreet,
    clientPostcode,
    clientCity,
    clientQuery,
    showClientList,
    manualAddress,
    showPreview,
    billingMode,
    amountText,
    hoursText,
    rateText,
    surcharges,
    surchargePctText,
    vatMode,
    vatManualText,
    vatAutoLocked,
    sendEmail,
    sending,
    showLegal,
    templateFile,
    templateInputRef,
    company,
    missing,
    filteredClients,
    // derived
    parsedHours,
    parsedRate,
    baseAmount,
    anySurcharge,
    surchargePct,
    surchargeAmount,
    netAmount,
    vatRate,
    vatAmount,
    totalGross,
    emailValid,
    // setters
    setTranscript,
    setTypedIdx,
    setClientId,
    setClientName,
    setClientStreet,
    setClientPostcode,
    setClientCity,
    setClientQuery,
    setShowClientList,
    setManualAddress,
    setShowPreview,
    setBillingMode,
    setAmountText,
    setHoursText,
    setRateText,
    setSurcharges,
    setSurchargePctText,
    setSurchargePctTouched,
    setVatMode,
    setVatManualText,
    setVatAutoLocked,
    setSendEmail,
    setShowLegal,
    // actions
    start,
    stop,
    applyClient,
    handleTemplateFile,
    handleSend,
    handleSave,
  };
}

export type VoiceInvoiceState = ReturnType<typeof useVoiceInvoice>;
