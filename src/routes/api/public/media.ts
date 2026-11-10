import { createFileRoute } from "@tanstack/react-router";
import { getR2 } from "@/lib/r2.server";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /^(image\/(jpeg|png|webp|heic|heif|gif)|audio\/[a-z0-9.+-]+|video\/(mp4|quicktime|webm)|application\/pdf)$/;
const KEY_RE = /^jobs\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/;

/**
 * POST: upload one project attachment (multipart field "file") to R2 and
 * return its key. Public because guests attach photos before they have an
 * account; abuse is limited by type/size checks and random keys.
 * GET ?key=...: stream a stored attachment back.
 */
export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) return Response.json({ error: "file missing" }, { status: 400 });
          const type = file.type.split(";")[0];
          if (!ALLOWED.test(type)) return Response.json({ error: "file type not allowed" }, { status: 415 });
          if (file.size > MAX_BYTES) return Response.json({ error: "file larger than 10 MB" }, { status: 413 });
          const safe = (file.name || "file").replace(/[^A-Za-z0-9._-]/g, "_").slice(-100) || "file";
          const key = `jobs/${crypto.randomUUID()}/${safe}`;
          await getR2().put(key, await file.arrayBuffer(), type);
          return Response.json({ key });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "upload failed";
          const notConfigured = msg.includes("not configured");
          if (!notConfigured) console.error("[media] upload failed", e);
          return Response.json({ error: msg }, { status: notConfigured ? 503 : 502 });
        }
      },
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") ?? "";
        if (!KEY_RE.test(key)) return new Response("bad key", { status: 400 });
        const res = await getR2().get(key);
        if (!res.ok) return new Response("not found", { status: 404 });
        return new Response(res.body, {
          headers: {
            "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
