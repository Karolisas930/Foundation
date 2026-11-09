import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listDirectoryPros } from "@/lib/landing-feed.functions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { TopBar } from "@/components/shared/TopBar";
import { SiteFooter } from "@/features/landing/components/SiteFooter";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Directory — Verified Meister trades across Baden-Württemberg" },
      {
        name: "description",
        content:
          "Search and browse verified handwerk professionals across Mannheim, Heidelberg, Karlsruhe, Stuttgart and Freiburg.",
      },
      { property: "og:title", content: "Directory — Verified Meister trades" },
      {
        property: "og:description",
        content: "Search and browse verified handwerk professionals across Baden-Württemberg.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["directory-pros"],
    queryFn: () => listDirectoryPros(),
    staleTime: 30_000,
  });
  const results = useMemo(() => {
    const all = data?.pros ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((c) =>
      [c.name, c.trade ?? "", c.city ?? ""].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [q, data]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1e233b] text-white/90">
      <div aria-hidden className="absolute inset-0 blueprint-grid opacity-60" />
      <TopBar signInTo="/onboarding" showMenu />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-5 lg:px-8">
        <div className="mb-6">
          <Link to="/" className="text-xs text-white/50 hover:text-orange-glow">
            ← Back to home
          </Link>
        </div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">Verified Meister Pros</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Browse verified handwerk professionals across Baden-Württemberg. Search by trade, city,
          PLZ or company name.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[#111424] border border-slate-800/80 px-4 py-3">
          <Search className="size-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trades, cities, PLZ…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <span className="text-[11px] uppercase tracking-wider text-white/40">
            {results.length} results
          </span>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {results.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl bg-[#111424] border border-slate-800/80 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-orange-500/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to="/p/$profileId" params={{ profileId: c.id }} className="truncate text-base font-bold text-white hover:text-orange-glow">{c.name}</Link>
                  </div>
                  <p className="mt-0.5 text-xs text-white/60">{c.trade ?? "Trade professional"}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-white/50">
                    <MapPin className="size-3" /> {c.city ?? "Baden-Württemberg"}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="col-span-full rounded-2xl bg-[#111424] border border-slate-800/80 p-6 text-center text-sm text-white/50">
              {isLoading
                ? "Loading registered pros…"
                : q
                  ? `No pros match "${q}".`
                  : "No pros have registered yet — check back soon."}
            </li>
          ) : null}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
