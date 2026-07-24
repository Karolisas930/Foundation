import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Database, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/shared/TopBar";
import {
  clearSupabaseRuntimeConfig,
  isPublishableKeyShape,
  isValidSupabaseUrl,
  loadSupabaseRuntimeConfig,
  saveSupabaseRuntimeConfig,
} from "@/integrations/supabase/runtime-config";
import "../styles/light-overrides.css";

export const Route = createFileRoute("/supabase-setup")({
  head: () => ({
    meta: [
      { title: "Connect your Supabase project — HANDWERK" },
      {
        name: "description",
        content:
          "Point this app at your own Supabase project by configuring the project URL and publishable key.",
      },
      { property: "og:title", content: "Connect your Supabase project — HANDWERK" },
      {
        property: "og:description",
        content: "Bring-your-own Supabase setup for HANDWERK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupabaseSetupPage,
});

function SupabaseSetupPage() {
  const navigate = useNavigate();
  const existing = loadSupabaseRuntimeConfig();
  const [url, setUrl] = useState(existing?.url ?? "");
  const [publishableKey, setPublishableKey] = useState(existing?.publishableKey ?? "");
  const [busy, setBusy] = useState(false);

  async function testConnection(): Promise<boolean> {
    try {
      const client = createClient(url.trim(), publishableKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      });
      // Cheap, non-destructive probe — auth endpoints require no schema.
      const { error } = await client.auth.getSession();
      if (error) throw error;
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Couldn't reach Supabase: ${msg}`);
      return false;
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedKey = publishableKey.trim();

    if (!isValidSupabaseUrl(trimmedUrl)) {
      toast.error("Enter a valid https Supabase project URL.");
      return;
    }
    if (!isPublishableKeyShape(trimmedKey)) {
      toast.error("That doesn't look like a publishable / anon key.");
      return;
    }
    if (trimmedKey.startsWith("sb_secret_") || trimmedKey.startsWith("service_role")) {
      toast.error("Never paste a service-role key here. Use the publishable/anon key.");
      return;
    }

    setBusy(true);
    const ok = await testConnection();
    if (!ok) {
      setBusy(false);
      return;
    }
    saveSupabaseRuntimeConfig({ url: trimmedUrl, publishableKey: trimmedKey });
    setBusy(false);
    toast.success("Supabase connected. Reloading…");
    setTimeout(() => window.location.reload(), 500);
  }

  function handleReset() {
    clearSupabaseRuntimeConfig();
    setUrl("");
    setPublishableKey("");
    toast.success("Cleared runtime override. Reloading…");
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <main className="min-h-screen bg-[#0f172a] intake-grid text-slate-50">
      <TopBar showSignIn={false} />

      <section className="mx-auto max-w-xl px-5 py-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Back home
        </button>

        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <Database className="size-5 text-orange" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white">
              Connect your Supabase project
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Point this app at your own Supabase instance. Values are stored in this browser only —
              nothing is baked into the codebase.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          <p className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Only paste the <strong>publishable</strong> (or legacy anon) key. Never paste a{" "}
              <code>service_role</code> / <code>sb_secret_</code> key into a browser — it bypasses
              Row Level Security.
            </span>
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="intake-card intake-card-tone-2 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div>
            <Label htmlFor="sb-url" className="text-slate-200">
              Project URL
            </Label>
            <Input
              id="sb-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://your-project-ref.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">
              Supabase dashboard → Project Settings → API → Project URL.
            </p>
          </div>

          <div>
            <Label htmlFor="sb-key" className="text-slate-200">
              Publishable (or anon) key
            </Label>
            <Input
              id="sb-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sb_publishable_… or eyJhbGciOi…"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              className="dark-input intake-input mt-1 border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">
              Project Settings → API → publishable / anon key.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={busy}
              className="h-11 flex-1 bg-orange text-white hover:bg-orange/90"
            >
              <Save className="mr-2 size-4" />
              {busy ? "Testing…" : "Test & save"}
            </Button>
            {existing ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-11 border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              >
                <RotateCcw className="mr-2 size-4" />
                Clear override
              </Button>
            ) : null}
          </div>

          {existing ? (
            <p className="text-xs text-emerald-300/80">
              Currently connected to <code className="text-emerald-200">{existing.url}</code>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              No runtime override set — the app is using the default build-time configuration.
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
