/**
 * Voice intake server function.
 *
 * Receives a base64-encoded audio blob from the browser, transcribes it via
 * the Lovable AI Gateway (`openai/gpt-4o-mini-transcribe`) and then asks
 * `google/gemini-3-flash-preview` to map the free-form transcript into the
 * structured HomeownerForm fields so we can pre-fill as much as possible.
 *
 * The result is intentionally permissive: every field is optional, the UI is
 * expected to merge non-empty values into existing state and prompt the user
 * to review.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TRADE_OPTIONS } from "@/regions";

export type VoiceIntakeFields = {
  title?: string;
  trade?: (typeof TRADE_OPTIONS)[number];
  notes?: string;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: "asap" | "1-3m" | "3-6m" | "flexible";
  postalCode?: string;
  city?: string;
  sizeM2?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  rooms?: number;
  floors?: number;
};

export type VoiceIntakeResult = {
  transcript: string;
  fields: VoiceIntakeFields;
};

const inputSchema = z.object({
  audioBase64: z.string().min(10),
  mimeType: z.string().min(1),
  filename: z.string().min(1),
});

const extractInputSchema = z.object({
  transcript: z.string().min(1),
});

export const transcribeAndExtract = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<VoiceIntakeResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured for this project.");
    }

    // Decode base64 -> Uint8Array -> Blob (we run on the Worker runtime).
    const binary = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary as unknown as BlobPart], { type: data.mimeType });

    // 1. Transcribe
    const sttForm = new FormData();
    sttForm.append("file", blob, data.filename);
    sttForm.append("model", "openai/gpt-4o-mini-transcribe");

    const sttRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: sttForm,
    });
    if (!sttRes.ok) {
      const text = await sttRes.text().catch(() => "");
      throw new Error(`Transcription failed (${sttRes.status}): ${text}`);
    }
    const sttJson = (await sttRes.json()) as { text?: string };
    const transcript = (sttJson.text ?? "").trim();
    if (!transcript) return { transcript: "", fields: {} };

    // 2. Extract structured fields via tool calling
    const tool = {
      type: "function" as const,
      function: {
        name: "fill_project_brief",
        description:
          "Extract HomeownerForm fields from a homeowner's spoken project brief. Only fill fields that the user clearly mentioned; leave everything else empty.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description:
                "A short 3-8 word project title summarising the work (e.g. 'Bathroom renovation in Mannheim').",
            },
            trade: {
              type: "string",
              enum: TRADE_OPTIONS as unknown as string[],
              description: "Best matching trade from the allowed list.",
            },
            notes: {
              type: "string",
              description:
                "Concise additional context the homeowner mentioned that doesn't fit other fields. 1-3 sentences max.",
            },
            budget: {
              type: "number",
              description:
                "Single total budget figure in EUR. If the homeowner gives a range (e.g. '10-15k'), set budgetMin and budgetMax instead and put the midpoint here.",
            },
            budgetMin: { type: "number", description: "Lower bound of budget range in EUR." },
            budgetMax: { type: "number", description: "Upper bound of budget range in EUR." },
            timeline: {
              type: "string",
              enum: ["asap", "1-3m", "3-6m", "flexible"],
              description:
                "Preferred timeframe — asap, within 1-3 months, 3-6 months, or flexible.",
            },
            postalCode: { type: "string", description: "German postal code (PLZ) if mentioned." },
            city: { type: "string", description: "City if mentioned." },
            sizeM2: {
              type: "number",
              description:
                "Total area in square meters. If only length×width is mentioned, compute it (e.g. '4 by 5 meters' → 20).",
            },
            lengthM: { type: "number", description: "Length in meters if mentioned." },
            widthM: { type: "number", description: "Width in meters if mentioned." },
            heightM: { type: "number", description: "Ceiling/room height in meters if mentioned." },
            rooms: { type: "integer", description: "Number of rooms/bathrooms if mentioned." },
            floors: { type: "integer", description: "Number of floors/storeys if mentioned." },
          },
          additionalProperties: false,
        },
      },
    };

    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You convert a homeowner's spoken project brief into structured intake fields for a German construction marketplace. Be generous: infer obvious values (e.g. a bathroom reno → trade 'Bathroom Renovation'; '4 by 5 meter room' → sizeM2 20; '10 to 15 thousand euros' → budgetMin 10000, budgetMax 15000, budget 12500; 'next month' → timeline '1-3m'). Convert sqft to m² and feet to meters. Leave a field empty only if the user gave no usable signal. Always call the fill_project_brief tool.",
          },
          { role: "user", content: `Transcript:\n"""\n${transcript}\n"""` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "fill_project_brief" } },
      }),
    });

    if (!chatRes.ok) {
      const text = await chatRes.text().catch(() => "");
      // Soft-fail: still return the transcript so the user can paste it.
      console.error("Extraction failed", chatRes.status, text);
      return { transcript, fields: {} };
    }

    const chatJson = (await chatRes.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { arguments?: string } }>;
        };
      }>;
    };

    const argsRaw = chatJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    let fields: VoiceIntakeFields = {};
    try {
      fields = JSON.parse(argsRaw) as VoiceIntakeFields;
    } catch {
      fields = {};
    }

    return { transcript, fields };
  });

/**
 * Extract structured HomeownerForm fields from a transcript that the
 * browser already obtained via the streaming /api/transcribe-stream
 * endpoint. Mirrors step 2 of `transcribeAndExtract`.
 */
export const extractFieldsFromTranscript = createServerFn({ method: "POST" })
  .inputValidator((data) => extractInputSchema.parse(data))
  .handler(async ({ data }): Promise<VoiceIntakeResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured for this project.");
    }
    const transcript = data.transcript.trim();
    if (!transcript) return { transcript: "", fields: {} };

    const tool = {
      type: "function" as const,
      function: {
        name: "fill_project_brief",
        description:
          "Extract HomeownerForm fields from a homeowner's spoken project brief. Only fill fields that the user clearly mentioned; leave everything else empty.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            trade: { type: "string", enum: TRADE_OPTIONS as unknown as string[] },
            notes: { type: "string" },
            budget: { type: "number" },
            budgetMin: { type: "number" },
            budgetMax: { type: "number" },
            timeline: { type: "string", enum: ["asap", "1-3m", "3-6m", "flexible"] },
            postalCode: { type: "string" },
            city: { type: "string" },
            sizeM2: { type: "number" },
            lengthM: { type: "number" },
            widthM: { type: "number" },
            heightM: { type: "number" },
            rooms: { type: "integer" },
            floors: { type: "integer" },
          },
          additionalProperties: false,
        },
      },
    };

    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You convert a homeowner's spoken project brief into structured intake fields for a German construction marketplace. Be generous: infer obvious values (e.g. a bathroom reno → trade 'Bathroom Renovation'; '4 by 5 meter room' → sizeM2 20; '10 to 15 thousand euros' → budgetMin 10000, budgetMax 15000, budget 12500; 'next month' → timeline '1-3m'). Convert sqft to m² and feet to meters. Leave a field empty only if the user gave no usable signal. Always call the fill_project_brief tool.",
          },
          { role: "user", content: `Transcript:\n"""\n${transcript}\n"""` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "fill_project_brief" } },
      }),
    });

    if (!chatRes.ok) {
      const text = await chatRes.text().catch(() => "");
      console.error("Extraction failed", chatRes.status, text);
      return { transcript, fields: {} };
    }

    const chatJson = (await chatRes.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const argsRaw = chatJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    let fields: VoiceIntakeFields = {};
    try {
      fields = JSON.parse(argsRaw) as VoiceIntakeFields;
    } catch {
      fields = {};
    }
    return { transcript, fields };
  });
