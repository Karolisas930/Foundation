/**
 * Custom invoice template merge pipeline.
 *
 * When the user uploads a custom layout on the Voice-to-Invoice sheet
 * (HTML or DOCX), we scan the file for `{{merge_tag}}` placeholders and
 * substitute the auto-populated profile info plus the calculated
 * labor / material split before rendering the final PDF.
 *
 * Supported tags (case-insensitive, whitespace tolerant):
 *   {{my_company_name}} {{my_address}} {{my_postal_code}} {{my_city}}
 *   {{my_email}} {{my_phone}} {{my_registration}} {{my_vat_id}}
 *   {{my_tax_id}} {{my_tax_number}} {{my_director}} {{my_iban}} {{my_bic}}
 *   {{my_bank_name}} {{client_name}} {{invoice_number}} {{invoice_date}}
 *   {{description}} {{labor_amount}} {{material_amount}} {{total_amount}}
 *
 * Binary PDF/image templates are passed through unmerged — we still emit
 * the merged PDF from the stored profile fields so the flow completes.
 */
import { jsPDF } from "jspdf";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { CompanyLegalInfo, InvoiceTemplateFile } from "./invoice-store";

export type TemplateMergeContext = {
  my_company_name: string;
  my_address: string;
  my_postal_code: string;
  my_city: string;
  my_email: string;
  my_phone: string;
  my_registration: string;
  my_vat_id: string;
  my_tax_id: string;
  my_tax_number: string;
  my_director: string;
  my_iban: string;
  my_bic: string;
  my_bank_name: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  description: string;
  labor_amount: string;
  material_amount: string;
  total_amount: string;
};

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

export function buildTemplateContext(input: {
  company: CompanyLegalInfo;
  clientName: string;
  description: string;
  laborAmount: number;
  materialAmount: number;
  invoiceNumber: string;
  invoiceDate: string; // ISO yyyy-mm-dd
}): TemplateMergeContext {
  const { company, clientName, description, laborAmount, materialAmount } = input;
  const total = laborAmount + materialAmount;
  return {
    my_company_name: company.companyName ?? "",
    my_address: company.address ?? "",
    my_postal_code: company.postalCode ?? "",
    my_city: company.city ?? "",
    my_email: company.email ?? "",
    my_phone: company.phone ?? "",
    my_registration: company.companyRegistration ?? "",
    my_vat_id: company.vatId ?? "",
    my_tax_id: company.vatId ?? "",
    my_tax_number: company.taxNumber ?? "",
    my_director: company.managingDirector ?? "",
    my_iban: company.iban ?? "",
    my_bic: company.bic ?? "",
    my_bank_name: company.bankName ?? "",
    client_name: clientName || "",
    invoice_number: input.invoiceNumber,
    invoice_date: input.invoiceDate,
    description: description || "",
    labor_amount: fmtEUR(laborAmount),
    material_amount: fmtEUR(materialAmount),
    total_amount: fmtEUR(total),
  };
}

/* ------------------------------------------------------------------ */
/*  data:URL helpers                                                   */
/* ------------------------------------------------------------------ */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const isB64 = /;base64/i.test(meta);
  if (isB64) {
    const bin = atob(payload);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new TextEncoder().encode(decodeURIComponent(payload));
}
function dataUrlToText(dataUrl: string): string {
  const bytes = dataUrlToUint8Array(dataUrl);
  return new TextDecoder("utf-8").decode(bytes);
}

/* ------------------------------------------------------------------ */
/*  Placeholder substitution                                           */
/* ------------------------------------------------------------------ */
const TAG_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function replaceTags(source: string, ctx: TemplateMergeContext): string {
  return source.replace(TAG_RE, (_m, key: string) => {
    const norm = key.toLowerCase() as keyof TemplateMergeContext;
    const v = ctx[norm];
    return typeof v === "string" ? v : "";
  });
}

export function scanTags(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(TAG_RE)) found.add(m[1].toLowerCase());
  return [...found];
}

/* ------------------------------------------------------------------ */
/*  PDF renderers                                                      */
/* ------------------------------------------------------------------ */
function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  // Preserve line breaks between block elements.
  div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  div.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,tr").forEach((el) => el.append("\n"));
  return (div.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

function textToPdfBlob(text: string, title: string): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - margin * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text || " ", usable);
  let y = margin;
  const lineHeight = 14;
  for (const line of lines as string[]) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
  doc.setProperties({ title });
  return doc.output("blob");
}

/* ------------------------------------------------------------------ */
/*  Public entry                                                       */
/* ------------------------------------------------------------------ */
export type CompiledInvoice = {
  pdfBlob: Blob;
  filename: string;
  /** Merged .docx blob (only present when the template was DOCX). */
  mergedDocxBlob?: Blob;
  mergedDocxFilename?: string;
  usedCustomTemplate: boolean;
  tagsFound: string[];
};

export async function compileInvoiceFromTemplate(
  template: InvoiceTemplateFile,
  ctx: TemplateMergeContext,
): Promise<CompiledInvoice> {
  const lowerName = template.name.toLowerCase();
  const isDocx =
    lowerName.endsWith(".docx") ||
    template.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isHtml =
    lowerName.endsWith(".html") || lowerName.endsWith(".htm") || template.type === "text/html";
  const isText = lowerName.endsWith(".txt") || template.type === "text/plain";
  const baseName = template.name.replace(/\.[^.]+$/, "") || "invoice";
  const pdfFilename = `${baseName}-${ctx.invoice_number}.pdf`;

  if (isDocx) {
    const bytes = dataUrlToUint8Array(template.dataUrl);
    const zip = new PizZip(bytes);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    doc.render(ctx as unknown as Record<string, string>);
    const mergedDocxBlob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    // Extract merged plain text from document.xml for the PDF render.
    const mergedZip = new PizZip(await mergedDocxBlob.arrayBuffer());
    const documentXml = mergedZip.file("word/document.xml")?.asText() ?? "";
    const mergedText = documentXml
      .replace(/<w:tab[^/]*\/>/g, "\t")
      .replace(/<w:br[^/]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const pdfBlob = textToPdfBlob(mergedText, `Invoice ${ctx.invoice_number}`);
    return {
      pdfBlob,
      filename: pdfFilename,
      mergedDocxBlob,
      mergedDocxFilename: `${baseName}-${ctx.invoice_number}.docx`,
      usedCustomTemplate: true,
      tagsFound: scanTags(documentXml),
    };
  }

  if (isHtml || isText) {
    const raw = dataUrlToText(template.dataUrl);
    const merged = replaceTags(raw, ctx);
    const plain = isHtml ? htmlToPlainText(merged) : merged;
    const pdfBlob = textToPdfBlob(plain, `Invoice ${ctx.invoice_number}`);
    return {
      pdfBlob,
      filename: pdfFilename,
      usedCustomTemplate: true,
      tagsFound: scanTags(raw),
    };
  }

  // Binary PDF / image template — can't rewrite placeholder tags inside a
  // rasterised layout in the browser, so emit a merged text-based PDF
  // derived from the profile data (still honouring the labor/material
  // split) so the "Save invoice draft" flow completes with the correct
  // figures.
  const fallback = [
    ctx.my_company_name,
    [ctx.my_address, `${ctx.my_postal_code} ${ctx.my_city}`.trim()].filter(Boolean).join("\n"),
    ctx.my_email && `E-Mail: ${ctx.my_email}`,
    ctx.my_phone && `Tel: ${ctx.my_phone}`,
    "",
    `Rechnung Nr. ${ctx.invoice_number}`,
    `Datum: ${ctx.invoice_date}`,
    ctx.client_name && `Kunde: ${ctx.client_name}`,
    "",
    ctx.description,
    "",
    `Arbeitslohn: ${ctx.labor_amount}`,
    `Material:    ${ctx.material_amount}`,
    `Gesamt:      ${ctx.total_amount}`,
    "",
    ctx.my_iban && `IBAN: ${ctx.my_iban}`,
    ctx.my_bic && `BIC: ${ctx.my_bic}`,
    ctx.my_bank_name && `Bank: ${ctx.my_bank_name}`,
    ctx.my_vat_id && `USt-IdNr: ${ctx.my_vat_id}`,
    ctx.my_registration && `HRB: ${ctx.my_registration}`,
  ]
    .filter(Boolean)
    .join("\n");
  const pdfBlob = textToPdfBlob(fallback, `Invoice ${ctx.invoice_number}`);
  return {
    pdfBlob,
    filename: pdfFilename,
    usedCustomTemplate: true,
    tagsFound: [],
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
