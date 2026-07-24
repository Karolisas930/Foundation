import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  TRADE_SPECIALTIES,
  getTradeSpecialtyBySlug,
  type TradeSpecialtyDef,
} from "@/api/db/schema";
import { TopBar } from "@/components/shared/TopBar";
import { SiteFooter } from "@/features/landing/components/SiteFooter";

export const Route = createFileRoute("/trades/$specialty")({
  loader: ({ params }) => {
    const def = getTradeSpecialtyBySlug(params.specialty);
    if (!def) throw notFound();
    return { def };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Trade not found — Chameleon" }, { name: "robots", content: "noindex" }],
      };
    }
    const { def } = loaderData;
    const title = `${def.label} Specialists — Chameleon`;
    const description = `Hire verified ${def.label} tradespeople in Germany. Required certifications: ${def.requiredCertifications.join(", ")}. Get fair, comparable quotes on Chameleon.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/trades/${params.specialty}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: `/trades/${params.specialty}` }],
    };
  },
  component: TradeSpecialtyPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-lg">Trade specialty not found.</p>
    </div>
  ),
});

function TradeSpecialtyPage() {
  const { def } = Route.useLoaderData() as { def: TradeSpecialtyDef };
  const siblings = Object.values(TRADE_SPECIALTIES).filter((s) => s.id !== def.id);

  return (
    <div className="relative min-h-screen bg-background text-foreground/90">
      <TopBar showSignIn />
      <main className="mx-auto max-w-4xl px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-orange">Trade specialty</p>
          <h1 className="text-4xl font-bold">{def.label}</h1>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Required certifications</h2>
          <ul className="list-disc pl-5 space-y-1">
            {def.requiredCertifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Coverage</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li>Permits: {def.features.permits ? "Yes" : "No"}</li>
            <li>Inspection: {def.features.inspection ? "Yes" : "No"}</li>
            <li>Subsidy programs: {def.features.subsidyPrograms ? "Yes" : "No"}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Other specialties</h2>
          <ul className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.id}>
                <a
                  href={`/trades/${s.slug}`}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:border-orange"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
