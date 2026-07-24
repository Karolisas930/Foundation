import { createFileRoute } from "@tanstack/react-router";

/**
 * Uptime probe. Performs a fast, non-destructive check and returns a
 * machine-readable status payload. Safe to hit from external monitors.
 *
 * When Drizzle is wired in, replace the `checkDatabase` body with:
 *
 *   import { db } from "@/api/db";
 *   import { sql } from "drizzle-orm";
 *   const started = Date.now();
 *   await db.execute(sql`select 1`);
 *   return { ok: true, latencyMs: Date.now() - started };
 */

async function checkDatabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  note?: string;
}> {
  const started = Date.now();
  // Drizzle is not yet installed in this project (see src/api/db/schema.ts).
  // Report the check as skipped rather than failing the probe.
  return {
    ok: true,
    latencyMs: Date.now() - started,
    note: "drizzle_not_configured",
  };
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const startedAt = Date.now();
        const database = await checkDatabase().catch((err: unknown) => ({
          ok: false,
          latencyMs: Date.now() - startedAt,
          note: err instanceof Error ? err.message : "unknown_error",
        }));

        const payload = {
          status: database.ok ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
          uptimeSeconds:
            typeof process !== "undefined" && typeof process.uptime === "function"
              ? Math.round(process.uptime())
              : null,
          checks: { database },
        };

        return new Response(JSON.stringify(payload), {
          status: database.ok ? 200 : 503,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
