import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resetTestData, seedTestData } from "@/lib/dev-seeder.functions";

export const Route = createFileRoute("/_dashboard/dev")({
  head: () => ({ meta: [{ title: "Dev Tools — HANDWERK" }] }),
  component: DevPage,
});

type SeedResult = Awaited<ReturnType<typeof seedTestData>>;

function DevPage() {
  const reset = useServerFn(resetTestData);
  const seed = useServerFn(seedTestData);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setBusy(true);
    setError(null);
    try {
      const r = await reset();
      toast.success(`Wiped ${r.deletedUsers} test user(s) and their data.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetAndSeed() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      await reset();
      const r = await seed();
      setResult(r);
      toast.success("Clean test data generated.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-semibold">Developer tools</h1>
        <p className="mt-2 text-sm text-slate-300">
          Seed and reset the end-to-end test dataset (users → services → jobs → match → booking →
          messages → 5-star review). Only admins can use this.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
          <h2 className="text-lg font-medium">Clean test data</h2>
          <p className="mt-1 text-sm text-slate-400">
            Wipes any existing <code className="text-xs">@handwerk-test.local</code> users and their
            related rows, then re-runs the full seed workflow.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={handleResetAndSeed}
              disabled={busy}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {busy ? "Working…" : "Reset & Generate Clean Test Data"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={busy}
              className="border-slate-600 text-slate-100 hover:bg-slate-800"
            >
              Reset only
            </Button>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-5 space-y-3 text-sm">
              <p className="text-slate-300">
                Password for all test users:{" "}
                <code className="rounded bg-slate-800 px-2 py-0.5 text-emerald-300">
                  {result.password}
                </code>
              </p>
              <ul className="space-y-1 text-slate-300">
                <li>
                  Client: <code>{result.users.client.email}</code>
                </li>
                <li>
                  Tradesperson: <code>{result.users.tradesperson.email}</code>
                </li>
                <li>
                  Business: <code>{result.users.business.email}</code>
                </li>
              </ul>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {Object.entries(result.counts).map(([k, v]) => (
                  <div key={k} className="rounded-md bg-slate-800/60 px-3 py-2">
                    <div className="text-xs uppercase text-slate-400">{k}</div>
                    <div className="text-lg font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
