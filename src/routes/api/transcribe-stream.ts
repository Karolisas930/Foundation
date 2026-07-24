/**
 * Streaming transcription proxy.
 *
 * Accepts a multipart/form-data POST with a single `file` (the recorded
 * audio blob) and forwards it to the Lovable AI Gateway transcription
 * endpoint with `stream=true`. Returns the upstream Server-Sent Events body
 * unchanged so the browser can render `transcript.text.delta` chunks live.
 *
 * Used by QuickVoiceCard to give the homeowner real-time feedback while
 * the AI listens.
 */
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/transcribe-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("LOVABLE_API_KEY not configured", { status: 500 });
        }

        const inForm = await request.formData();
        const file = inForm.get("file");
        if (!(file instanceof Blob)) {
          return new Response("Missing `file` part", { status: 400 });
        }

        const filename = (inForm.get("filename") as string | null) ?? "voice-brief.webm";

        const upstreamForm = new FormData();
        upstreamForm.append("file", file, filename);
        upstreamForm.append("model", "openai/gpt-4o-mini-transcribe");
        upstreamForm.append("stream", "true");

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstreamForm,
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Transcription failed", {
            status: upstream.status || 502,
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
