import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OcrInput = z.object({
  fileBase64: z.string().min(10),
  mime: z.string().default("image/jpeg"),
});

export type OcrResult = {
  amount: number | null;
  date: string | null;
  vendor: string | null;
  category: "material" | "tool" | "fuel" | "other" | null;
};

/**
 * OCR a receipt image via Lovable AI Gateway (Gemini).
 * Returns best-effort extracted amount, date (YYYY-MM-DD), vendor, category.
 */
export const ocrReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => OcrInput.parse(data))
  .handler(async ({ data }): Promise<OcrResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const dataUrl = `data:${data.mime};base64,${data.fileBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract structured data from receipts for a German tradesperson. Respond ONLY with compact JSON.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract from this receipt. Return JSON with keys: amount (number, total gross in EUR), date (YYYY-MM-DD), vendor (string), category (one of: material, tool, fuel, other). Use null if unknown.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[ocrReceipt]", res.status, text);
      throw new Error(`OCR failed: ${res.status}`);
    }

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { amount: null, date: null, vendor: null, category: null };
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<OcrResult>;
      const amount =
        typeof parsed.amount === "number"
          ? parsed.amount
          : parsed.amount != null
            ? Number(String(parsed.amount).replace(",", "."))
            : null;
      const validCat = ["material", "tool", "fuel", "other"] as const;
      const category =
        parsed.category && (validCat as readonly string[]).includes(parsed.category)
          ? (parsed.category as OcrResult["category"])
          : null;
      return {
        amount: Number.isFinite(amount as number) ? (amount as number) : null,
        date: parsed.date ?? null,
        vendor: parsed.vendor ?? null,
        category,
      };
    } catch {
      return { amount: null, date: null, vendor: null, category: null };
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Credential cross-check pipeline
//
// Multi-step fraud prevention for business credential documents:
//   1. AI vision extracts identifiers + visual tamper markers + validUntil.
//   2. Server-side fetch to an external business registry to confirm the
//      Business Name, Registered Address and Active Trade Classification.
//   3. Compares registry answer against the contractor's profile row.
//   4. Approves only when identity match, no tamper markers and unexpired.
//
// External endpoint is configurable — set BUSINESS_REGISTRY_API_URL (e.g.
// Handelsregister.de partner API, North Data, Creditreform) and optionally
// BUSINESS_REGISTRY_API_KEY. When unset the check fails closed (rejected).
// The endpoint MUST accept ?steuernummer=… or ?handelsregister=… and return
// { businessName, registeredAddress, tradeClassification, active }.
// ─────────────────────────────────────────────────────────────────────────────

const REJECTION_NOTE =
  "Automated verification failed: Business registry name does not match the document credentials.";

const MANUAL_REVIEW_NOTE =
  "Automated verification unavailable: business registry could not be reached. Queued for manual review.";

const CredentialInput = z.object({
  verificationId: z.string().uuid(),
  fileBase64: z.string().min(10),
  mime: z.string().default("image/jpeg"),
});

type DocExtraction = {
  businessName: string | null;
  registeredAddress: string | null;
  steuernummer: string | null;
  handelsregisterNummer: string | null;
  validUntil: string | null; // ISO YYYY-MM-DD
  tamperMarkers: string[]; // e.g. ["font mismatch", "erased signature"]
  tamperSuspected: boolean;
};

type RegistryRecord = {
  businessName: string | null;
  registeredAddress: string | null;
  tradeClassification: string | null;
  active: boolean;
};

type RegistryLookup =
  | { ok: true; record: RegistryRecord }
  | { ok: false; reason: "not_configured" | "no_identifiers" | "fetch_failed"; detail?: string };

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(gmbh|ug|kg|ohg|ag|e\.k\.|ek|mbh|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fuzzyMatch(a: string | null, b: string | null): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

async function extractCredential(
  fileBase64: string,
  mime: string,
  apiKey: string,
): Promise<DocExtraction> {
  const dataUrl = `data:${mime};base64,${fileBase64}`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a forensic OCR engine for German business credential documents. Extract identifiers AND look for visual tamper markers (font/kerning mismatches, misaligned baselines, cloned pixels, erased/overwritten fields, mismatched paper texture, inconsistent JPEG artifacts, seal/signature inconsistencies). Respond ONLY with compact JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Return JSON with keys: businessName (string|null), registeredAddress (string|null, full one-line), steuernummer (string|null, German tax number), handelsregisterNummer (string|null, e.g. "HRB 12345 München"), validUntil (YYYY-MM-DD|null), tamperMarkers (string[] of observed anomalies, empty if clean), tamperSuspected (boolean).',
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI extraction failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};
  return {
    businessName: parsed.businessName ?? null,
    registeredAddress: parsed.registeredAddress ?? null,
    steuernummer: parsed.steuernummer ?? null,
    handelsregisterNummer: parsed.handelsregisterNummer ?? null,
    validUntil: parsed.validUntil ?? null,
    tamperMarkers: Array.isArray(parsed.tamperMarkers) ? parsed.tamperMarkers : [],
    tamperSuspected: Boolean(parsed.tamperSuspected),
  };
}

async function lookupRegistry(
  steuernummer: string | null,
  handelsregisterNummer: string | null,
): Promise<RegistryLookup> {
  const base = process.env.BUSINESS_REGISTRY_API_URL;
  if (!base) {
    console.warn("[credential-verify] BUSINESS_REGISTRY_API_URL not configured");
    return { ok: false, reason: "not_configured" };
  }
  const params = new URLSearchParams();
  if (steuernummer) params.set("steuernummer", steuernummer);
  if (handelsregisterNummer) params.set("handelsregister", handelsregisterNummer);
  if ([...params.keys()].length === 0) return { ok: false, reason: "no_identifiers" };

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.BUSINESS_REGISTRY_API_KEY;
  if (key) headers.Authorization = `Bearer ${key}`;

  const url = `${base}${base.includes("?") ? "&" : "?"}${params.toString()}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error("[credential-verify] registry lookup failed", res.status);
      return { ok: false, reason: "fetch_failed", detail: `HTTP ${res.status}` };
    }
    const j = (await res.json()) as Partial<RegistryRecord>;
    return {
      ok: true,
      record: {
        businessName: j.businessName ?? null,
        registeredAddress: j.registeredAddress ?? null,
        tradeClassification: j.tradeClassification ?? null,
        active: Boolean(j.active),
      },
    };
  } catch (err) {
    console.error("[credential-verify] registry lookup threw", err);
    return {
      ok: false,
      reason: "fetch_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export type CredentialVerifyResult = {
  status: "approved" | "rejected" | "needs_manual_review";
  note: string | null;
  checks: {
    identityMatch: boolean;
    addressMatch: boolean;
    tradeMatch: boolean;
    registryActive: boolean;
    notExpired: boolean;
    tamperClean: boolean;
  };
  extraction: DocExtraction;
  registry: RegistryRecord | null;
  registryUnavailableReason: "not_configured" | "no_identifiers" | "fetch_failed" | null;
  daysUntilExpiry: number | null;
};

export const verifyCredentialDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => CredentialInput.parse(data))
  .handler(async ({ data, context }): Promise<CredentialVerifyResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { supabase, userId } = context;

    // Step 1 — AI extraction + tamper scan
    const extraction = await extractCredential(data.fileBase64, data.mime, apiKey);

    // Step 2 — external business registry cross-check
    const lookup = await lookupRegistry(extraction.steuernummer, extraction.handelsregisterNummer);
    const registry = lookup.ok ? lookup.record : null;
    const registryUnavailableReason = lookup.ok ? null : lookup.reason;

    // Load contractor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, full_name, address_line1, city, postal_code, trades")
      .eq("id", userId)
      .maybeSingle();

    const profileName = profile?.company_name || profile?.full_name || null;
    const profileAddress = profile
      ? [profile.address_line1, profile.postal_code, profile.city].filter(Boolean).join(" ")
      : null;
    const profileTrades: string[] = profile?.trades ?? [];

    // Step 3 — cross-check registry ↔ document ↔ profile
    const identityMatch =
      !!registry &&
      fuzzyMatch(registry.businessName, extraction.businessName) &&
      fuzzyMatch(registry.businessName, profileName);

    const addressMatch =
      !!registry &&
      fuzzyMatch(registry.registeredAddress, extraction.registeredAddress) &&
      fuzzyMatch(registry.registeredAddress, profileAddress);

    const tradeMatch =
      !!registry &&
      !!registry.tradeClassification &&
      (profileTrades.length === 0 ||
        profileTrades.some((t) => fuzzyMatch(t, registry.tradeClassification)));

    const registryActive = !!registry?.active;

    // Step 4 — expiry + tamper
    const now = new Date();
    let daysUntilExpiry: number | null = null;
    let notExpired = true;
    if (extraction.validUntil) {
      const exp = new Date(extraction.validUntil);
      if (!Number.isNaN(exp.getTime())) {
        daysUntilExpiry = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        notExpired = daysUntilExpiry >= 0;
      }
    }
    const tamperClean = !extraction.tamperSuspected && extraction.tamperMarkers.length === 0;

    const registryCheckPassed = identityMatch && addressMatch && tradeMatch && registryActive;
    const documentCheckPassed = notExpired && tamperClean;

    // Registry unreachable (not configured or fetch failed with no identifiers is
    // still a rejection — the document itself is deficient). Route to manual
    // review instead of auto-approving or auto-rejecting.
    const registryUnreachable =
      registryUnavailableReason === "not_configured" ||
      registryUnavailableReason === "fetch_failed";

    let status: CredentialVerifyResult["status"];
    let note: string | null;
    if (registryUnreachable) {
      // Hard-fail the document-side checks regardless (tamper/expiry) — they
      // stay in the payload so the human reviewer sees them.
      status = documentCheckPassed ? "needs_manual_review" : "rejected";
      note = status === "rejected" ? REJECTION_NOTE : MANUAL_REVIEW_NOTE;
    } else if (registryCheckPassed && documentCheckPassed) {
      status = "approved";
      note = null;
    } else {
      status = "rejected";
      note = REJECTION_NOTE;
    }

    const result: CredentialVerifyResult = {
      status,
      note,
      checks: {
        identityMatch,
        addressMatch,
        tradeMatch,
        registryActive,
        notExpired,
        tamperClean,
      },
      extraction,
      registry,
      registryUnavailableReason,
      daysUntilExpiry,
    };

    // Persist verdict on the verifications row. The DB enum currently has
    // {pending_review, approved, rejected} — map needs_manual_review onto
    // pending_review so a human sees it in the review queue.
    const dbStatus: "approved" | "rejected" | "pending_review" =
      status === "needs_manual_review" ? "pending_review" : status;
    await supabase
      .from("verifications")
      .update({
        status: dbStatus,
        // Round-trip to a plain JSON value so it satisfies the generated `Json` type.
        ocr_json: JSON.parse(JSON.stringify(result)),
      })
      .eq("id", data.verificationId)
      .eq("user_id", userId);

    return result;
  });
