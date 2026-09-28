import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ChevronDown, MapPin, Radar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { listContractorJobFeed } from "@/lib/job-feed.functions";
import { TRADE_CODES, toTradeCode, tradeLabel } from "@/regions/trade-codes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_dashboard/contractor/radar")({
  head: () => ({
    meta: [
      { title: "Job Radar — HANDWERK" },
      { name: "description", content: "Open homeowner jobs near you that match your trades." },
      { property: "og:title", content: "Job Radar — HANDWERK" },
      { property: "og:description", content: "Open homeowner jobs near you that match your trades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RadarPage,
});

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function RadarPage() {
  const { i18n } = useTranslation();
  const fetchFeed = useServerFn(listContractorJobFeed);
  const [radius, setRadius] = useState<number | null>(null);
  const [extra, setExtra] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["contractor", "radar", radius, extra],
    queryFn: () => fetchFeed({ data: { radiusKm: radius ?? undefined, extraTrades: extra } }),
    staleTime: 30_000,
    retry: false,
  });

  const ownCodes = useMemo(
    () => (data?.profile.trades ?? []).map((t) => toTradeCode(t)).filter(Boolean) as string[],
    [data],
  );
  const selected = useMemo(() => new Set([...ownCodes, ...extra]), [ownCodes, extra]);
  const effectiveRadius = radius ?? data?.profile.serviceRadiusKm ?? 50;

  const jobs = (data?.priority ?? []).filter((c) => {
    const code = toTradeCode(c.job.trade);
    return code ? selected.has(code) : false;
  });

  const toggle = (code: string) =>
    setExtra((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <Link to="/contractor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Radar className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Job Radar</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${jobs.length} potential clients matching your trades`}
          </p>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-foreground">Search radius</span>
            <span className="font-mono text-primary">{effectiveRadius} km</span>
          </div>
          <Slider
            min={5}
            max={200}
            step={5}
            value={[effectiveRadius]}
            onValueChange={(v) => setRadius(v[0])}
          />
          {data?.profile.postalCode ? (
            <p className="mt-1 text-xs text-muted-foreground">Around {data.profile.postalCode}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Add your postcode in your profile for distance matching.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Trades</p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground">
                <span className="truncate">
                  {[...selected].map((c) => tradeLabel(c, i18n.language)).join(", ") || "Select trades"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-80 w-(--radix-popover-trigger-width) overflow-y-auto p-1">
              {TRADE_CODES.map((code) => {
                const own = ownCodes.includes(code);
                const on = selected.has(code);
                return (
                  <button
                    key={code}
                    disabled={own}
                    onClick={() => toggle(code)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-70"
                  >
                    <Check className={`h-4 w-4 ${on ? "opacity-100" : "opacity-0"}`} />
                    {tradeLabel(code, i18n.language)}
                    {own ? <span className="ml-auto text-[10px] uppercase text-muted-foreground">yours</span> : null}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {isLoading ? "Looking for jobs…" : "No matching jobs — try a larger radius or add more trades."}
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map(({ job: j, classification }) => (
            <li key={j.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{j.title}</p>
                <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {classification.score.percent}%
                </span>
              </div>
              {j.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {j.city ?? j.locationZip}
                  {classification.score.distanceKm != null ? ` · ${Math.round(classification.score.distanceKm)} km` : ""}
                </span>
                <span className="font-mono font-semibold text-foreground">{eur(j.budgetTotal)}</span>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {tradeLabel(j.trade, i18n.language)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
