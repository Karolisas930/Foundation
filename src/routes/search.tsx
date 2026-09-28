import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLandingData } from "@/lib/landing-stats.functions";
import { ProCard } from "@/features/landing/components/ProCard";
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
  const fetchLanding = useServerFn(getLandingData);
  const { data } = useQuery({
    queryKey: ["landing-data"],
    queryFn: () => fetchLanding(),
    staleTime: 30_000,
  });
  const pros = data?.verifiedPros;
  const results = useMemo(() => {
    const all = pros ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((c) =>
      [c.name, c.trade, c.city ?? "", c.zip ?? ""].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [q, pros]);

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
            <li key={c.id}>
              <ProCard pro={c} />
            </li>
          ))}
          {results.length === 0 ? (
            <li className="col-span-full rounded-2xl bg-[#111424] border border-slate-800/80 p-6 text-center text-sm text-white/50">
              {q ? `No verified pros match "${q}".` : "No fully verified pros yet."}
            </li>
          ) : null}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
