import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Search } from "lucide-react";
import { TopBar } from "@/components/shared/TopBar";
import { SiteFooter } from "@/features/landing/components/SiteFooter";

type Contractor = {
  id: string;
  name: string;
  trade: string;
  city: string;
  plz: string;
  rating: number;
  verified: boolean;
};

const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: "c-01",
    name: "Meister Bauer GmbH",
    trade: "Bricklaying & Concrete",
    city: "Mannheim",
    plz: "68159",
    rating: 4.9,
    verified: true,
  },
  {
    id: "c-02",
    name: "Fliesen Kaya",
    trade: "Tiling & Mosaics",
    city: "Heidelberg",
    plz: "69115",
    rating: 4.8,
    verified: true,
  },
  {
    id: "c-03",
    name: "Dach & Dämmung Karlsruhe",
    trade: "Roofing & Insulation",
    city: "Karlsruhe",
    plz: "76131",
    rating: 4.7,
    verified: true,
  },
  {
    id: "c-04",
    name: "Schreinerei Freiburg",
    trade: "Carpentry & Timber",
    city: "Freiburg",
    plz: "79100",
    rating: 4.9,
    verified: true,
  },
  {
    id: "c-05",
    name: "Elektro Schwarz",
    trade: "Electrical",
    city: "Stuttgart",
    plz: "70173",
    rating: 4.6,
    verified: true,
  },
  {
    id: "c-06",
    name: "Sanitär Müller",
    trade: "Plumbing & Heating",
    city: "Mannheim",
    plz: "68161",
    rating: 4.5,
    verified: false,
  },
  {
    id: "c-07",
    name: "Malerbetrieb Weber",
    trade: "Painting & Plaster",
    city: "Heidelberg",
    plz: "69117",
    rating: 4.7,
    verified: true,
  },
  {
    id: "c-08",
    name: "Garten Landschaft KA",
    trade: "Landscaping",
    city: "Karlsruhe",
    plz: "76133",
    rating: 4.4,
    verified: false,
  },
];

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
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MOCK_CONTRACTORS;
    return MOCK_CONTRACTORS.filter((c) =>
      [c.name, c.trade, c.city, c.plz].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [q]);

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
                    <h2 className="truncate text-base font-bold text-white">{c.name}</h2>
                    {c.verified ? (
                      <BadgeCheck
                        className="size-4 shrink-0 text-orange-glow"
                        aria-label="Verified"
                      />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-white/60">{c.trade}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-white/50">
                    <MapPin className="size-3" /> {c.plz} · {c.city}
                  </p>
                </div>
                <div className="shrink-0 rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[11px] font-bold text-orange-glow">
                  ★ {c.rating.toFixed(1)}
                </div>
              </div>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="col-span-full rounded-2xl bg-[#111424] border border-slate-800/80 p-6 text-center text-sm text-white/50">
              No trades match "{q}".
            </li>
          ) : null}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
