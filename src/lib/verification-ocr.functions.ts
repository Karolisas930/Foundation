/**
 * verification-ocr — Analyzes uploaded credential documents (Meisterbrief or
 * Betriebshaftpflicht insurance policy) with the Lovable AI multimodal model,
 * stores the file in the private `verifications` bucket, and inserts a row in
 * the `verifications` table with the structured extraction payload.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  fileBase64: z.string().min(1),
  mime: z.string().min(1),
  fileName: z.string().min(1),
  hint: z.enum(["meisterbrief", "insurance"]).optional(),
});

type MeisterExtraction = {
  fullName: string | null;
  trade: string | null;
  issuingChamber: string | null;
  registrationNumber: string | null;
  issuedOn: string | null; // ISO YYYY-MM-DD
};

type InsuranceExtraction = {
  providerName: string;
  policyNumber: string;
  coverageAmountCents: number;
  validUntil: string | null; // ISO YYYY-MM-DD
  hasActiveCoverage: boolean;
};

type ExtractionResult =
  | { kind: "meisterbrief"; extraction: MeisterExtraction; confidence: number }
  | { kind: "insurance"; extraction: InsuranceExtraction; confidence: number }
  | { kind: "unknown"; confidence: number; reason?: string };

const SYSTEM_PROMPT = `You are an OCR + extraction engine for German handwerk credential documents.

Given ONE uploaded document image or PDF, decide whether it is:
  - "meisterbrief"      = Meisterbrief / Handwerksrolle / Handwerkskammer trade credential
  - "insurance_policy"  = Betriebshaftpflicht / business liability insurance policy or certificate
  - "unknown"           = anything else, or too blurry / low-quality to parse confidently

Then return STRICT JSON matching this TypeScript type — no prose, no markdown:

type Result =
  | { kind: "meisterbrief";
      confidence: number; // 0..1
      extraction: {
        fullName: string | null;
        trade: string | null;              // e.g. "Elektrotechniker"
        issuingChamber: string | null;     // e.g. "Handwerkskammer München"
        registrationNumber: string | null; // Handwerksrolle-Nr. if visible
        issuedOn: string | null;           // ISO YYYY-MM-DD
      };
    }
  | { kind: "insurance";
      confidence: number; // 0..1
      extraction: {
        providerName: string;              // e.g. "Allianz", "VHV", "Ergo"
        policyNumber: string;              // "Versicherungsschein-Nr."
        coverageAmountCents: number;       // e.g. 3.000.000 EUR -> 300000000
        validUntil: string | null;         // ISO YYYY-MM-DD
        hasActiveCoverage: boolean;        // true if valid today and not cancelled
      };
    }
  | { kind: "unknown"; confidence: number; reason?: string };

Rules:
- Convert EUR amounts to CENTS (multiply by 100). Strip "EUR", "€", dots.
- If a field is unreadable, use null (strings) or an honest low confidence.
- If the document is blurry, cropped, or clearly not a credential doc, return { kind: "unknown", confidence: <=0.4 }.
- Do NOT invent data. Never wrap the JSON in code fences.`;

const MODEL = "google/gemini-3-flash-preview";

async function callGateway(fileBase64: string, mime: string, hint?: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const userText = hint
    ? `Hint from the upload UI: user tagged this as "${hint}". Verify and extract accordingly.`
    : "Classify the document then extract the matching fields.";

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          mime === "application/pdf"
            ? {
                type: "file",
                file: {
                  filename: "upload.pdf",
                  file_data: `data:${mime};base64,${fileBase64}`,
                },
              }
            : {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${fileBase64}` },
              },
        ],
      },
    ],
    response_format: { type: "json_object" },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(content) as ExtractionResult;
  } catch {
    // Try to recover JSON from wrapped output
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as ExtractionResult;
      } catch {
        /* fall through */
      }
    }
    return { kind: "unknown" as const, confidence: 0, reason: "Model did not return JSON" };
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",", 2)[1] : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export const extractVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { fileBase64, mime, fileName, hint } = data;
    const { supabase, userId } = context;

    // 1. Ask Lovable AI to classify + extract
    let extraction: ExtractionResult;
    try {
      extraction = await callGateway(fileBase64, mime, hint);
    } catch (err) {
      console.error("[verification-ocr] gateway error", err);
      return {
        ok: false as const,
        error: "ai_failed" as const,
        message: err instanceof Error ? err.message : "AI extraction failed",
      };
    }

    // 2. Bail early if we cannot classify with reasonable confidence.
    if (extraction.kind === "unknown" || extraction.confidence < 0.35) {
      return {
        ok: false as const,
        error: "unreadable" as const,
        kind: hint ?? "unknown",
        message:
          extraction.kind === "unknown" && extraction.reason
            ? extraction.reason
            : "Document could not be read with confidence",
      };
    }

    // 3. Upload the raw file into the user's folder in the private bucket.
    const kind = extraction.kind; // "meisterbrief" | "insurance"
    const bytes = base64ToBytes(fileBase64);
    const path = `${userId}/${kind}/${Date.now()}_${safeFileName(fileName)}`;

    const uploadRes = await supabase.storage.from("verifications").upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });

    if (uploadRes.error) {
      console.error("[verification-ocr] storage upload failed", uploadRes.error);
      return {
        ok: false as const,
        error: "storage_failed" as const,
        message: uploadRes.error.message,
      };
    }

    // 4. Insert the verifications row with the structured OCR payload.
    const insertRes = await supabase
      .from("verifications")
      .insert({
        user_id: userId,
        kind,
        status: "pending_review",
        file_path: path,
        file_name: fileName,
        mime_type: mime,
        ocr_json: {
          confidence: extraction.confidence,
          extraction: extraction.extraction,
        },
      })
      .select("id, kind, status, file_path, file_name, ocr_json, created_at")
      .single();

    if (insertRes.error) {
      console.error("[verification-ocr] insert failed", insertRes.error);
      return {
        ok: false as const,
        error: "db_failed" as const,
        message: insertRes.error.message,
      };
    }

    return {
      ok: true as const,
      kind,
      confidence: extraction.confidence,
      extraction: extraction.extraction,
      record: insertRes.data,
    };
  });

export type ExtractVerificationResult = Awaited<ReturnType<typeof extractVerification>>;
