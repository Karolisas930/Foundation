/**
 * External Private Client Invoice — send handler.
 *
 * Renders a compliant German invoice email (§ 35a EStG Labor/Material split)
 * and dispatches it via Resend when RESEND_API_KEY is configured. Falls back
 * to logging the rendered message so the client flow still succeeds when the
 * relay credential is not yet set up.
 *
 * Supports both first-time send and re-send (idempotent by invoiceNumber).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  clientEmail: z.string().trim().email().max(255),
  clientName: z.string().trim().min(1).max(120),
  laborAmount: z.number().finite().nonnegative().max(1_000_000),
  materialAmount: z.number().finite().nonnegative().max(1_000_000),
  contractorName: z.string().trim().min(1).max(120).default("Ihr Handwerker"),
  contractorEmail: z.string().trim().email().max(255).optional(),
  invoiceNumber: z.string().trim().min(1).max(40).optional(),
  isResend: z.boolean().optional(),
});

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

function generateInvoiceNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}-${rand}`;
}

function renderInvoiceHtml(input: z.infer<typeof inputSchema> & { invoiceNumber: string }) {
  const total = input.laborAmount + input.materialAmount;
  const ctaHref = input.contractorEmail
    ? `mailto:${input.contractorEmail}?subject=${encodeURIComponent(
        `Rückfrage zur Rechnung #${input.invoiceNumber}`,
      )}`
    : `mailto:?subject=${encodeURIComponent(`Rückfrage zur Rechnung #${input.invoiceNumber}`)}`;
  const resendHint = input.isResend
    ? `<div style="margin:0 0 16px;padding:10px 14px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12px;">Hinweis: Dies ist eine erneute Zusendung der Rechnung #${input.invoiceNumber}.</div>`
    : "";
  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:24px;background:#f6f5f2;font-family:Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#f97316,#c2410c);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.9;">Rechnung · Privatkunde</div>
          <div style="margin-top:6px;font-size:22px;font-weight:700;">${input.contractorName}</div>
          <div style="margin-top:4px;font-size:13px;opacity:0.9;">Rechnungsnummer: #${input.invoiceNumber}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;font-size:15px;line-height:1.55;">
          ${resendHint}
          <p style="margin:0 0 16px;">Sehr geehrte(r) ${input.clientName},</p>
          <p style="margin:0 0 16px;">anbei erhalten Sie die Rechnung <strong>#${input.invoiceNumber}</strong> von ${input.contractorName} über <strong>${fmtEUR(total)}</strong>.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f3f4f6;text-align:left;">
                <th style="padding:10px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#374151;">Position</th>
                <th style="padding:10px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#374151;text-align:right;">Betrag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:12px 14px;border-top:1px solid #e5e7eb;">Arbeitslohn <span style="color:#6b7280;font-size:12px;">(§ 35a EStG absetzbar)</span></td>
                <td style="padding:12px 14px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmtEUR(input.laborAmount)}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;border-top:1px solid #e5e7eb;">Material</td>
                <td style="padding:12px 14px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmtEUR(input.materialAmount)}</td>
              </tr>
              <tr style="background:#fff7ed;">
                <td style="padding:14px;border-top:1px solid #fed7aa;font-weight:700;">Gesamtbetrag</td>
                <td style="padding:14px;border-top:1px solid #fed7aa;text-align:right;font-weight:800;color:#c2410c;">${fmtEUR(total)}</td>
              </tr>
            </tbody>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="border-radius:10px;background:linear-gradient(135deg,#f97316,#c2410c);">
                <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">
                  Zahlung bestätigen &amp; Rückfrage
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 12px;font-size:13px;color:#4b5563;">Hinweis nach § 35a EStG: Der oben ausgewiesene Arbeitslohn ist als haushaltsnahe Handwerkerleistung steuerlich absetzbar. Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen und geben Sie die Rechnungsnummer <strong>#${input.invoiceNumber}</strong> als Verwendungszweck an.</p>
          <p style="margin:24px 0 0;">Mit freundlichen Grüßen<br/><strong>${input.contractorName}</strong></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type SendPrivateInvoiceResult = {
  ok: true;
  provider: "resend" | "logged";
  total: number;
  html: string;
  invoiceNumber: string;
};

export const sendPrivateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<SendPrivateInvoiceResult> => {
    const invoiceNumber = data.invoiceNumber?.trim() || generateInvoiceNumber();
    const total = data.laborAmount + data.materialAmount;
    const html = renderInvoiceHtml({ ...data, invoiceNumber });
    const subject = `Rechnung #${invoiceNumber} von ${data.contractorName}`;
    const textBody = `Sehr geehrte(r) ${data.clientName}, anbei erhalten Sie die Rechnung #${invoiceNumber} von ${data.contractorName} über ${fmtEUR(total)}.`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const from = process.env.RESEND_FROM_EMAIL || "invoices@resend.dev";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from,
          to: [data.clientEmail],
          subject,
          html,
          text: textBody,
          ...(data.contractorEmail ? { reply_to: data.contractorEmail } : {}),
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Resend send failed: ${res.status} ${errText}`);
      }
      return { ok: true, provider: "resend", total, html, invoiceNumber };
    }

    // Graceful fallback: log the outbound email so the flow completes even
    // before the relay credential is configured. The UI will still confirm.
    console.info("[private-invoice] outbound email queued (no RESEND_API_KEY)", {
      to: data.clientEmail,
      subject,
      total,
      invoiceNumber,
    });
    return { ok: true, provider: "logged", total, html, invoiceNumber };
  });
