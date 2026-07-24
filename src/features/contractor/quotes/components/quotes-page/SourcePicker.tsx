import { useMemo, useState } from "react";
import { Search, Sparkles, Users, PencilLine, MapPin, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dispatchLeadsForCurrentUser } from "@/features/contractor/leads/lead-dispatch";
import {
  MARKETPLACE_CLIENTS,
  type MarketplaceClient,
} from "@/features/contractor/profile/components/toolbelt/marketplace-clients";
import type { EcosystemProject } from "@/core/demo-session";
import type { QuoteSource, Prefill } from "./constants";

function SourceTile({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
        active
          ? "border-orange-400/50 bg-orange-500/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-orange-glow" : "text-slate-300"}`} aria-hidden />
      <span className="mt-1.5 text-xs font-semibold text-white">{label}</span>
      <span className="mt-0.5 text-[10px] text-slate-400">{hint}</span>
    </button>
  );
}

function PickerEmpty({
  icon: Icon,
  title,
  hint,
  cta,
  onCta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
      <Icon className="mx-auto h-6 w-6 text-slate-500" aria-hidden />
      <div className="mt-2 text-sm font-semibold text-slate-100">{title}</div>
      <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">{hint}</p>
      <Button onClick={onCta} variant="secondary" size="sm" className="mt-3">
        {cta}
      </Button>
    </div>
  );
}

export function SourcePicker({ onPick }: { onPick: (s: QuoteSource, p?: Prefill) => void }) {
  const dispatch = useMemo(() => dispatchLeadsForCurrentUser(), []);
  const leads: EcosystemProject[] = useMemo(() => {
    const uniq = new Map<string, EcosystemProject>();
    [...dispatch.priority, ...dispatch.alerts].forEach((l) => uniq.set(l.project.id, l.project));
    return Array.from(uniq.values()).slice(0, 12);
  }, [dispatch]);

  const [tab, setTab] = useState<QuoteSource>(leads.length > 0 ? "lead" : "client");
  const [q, setQ] = useState("");

  const filteredLeads = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return leads;
    return leads.filter(
      (l) =>
        l.title.toLowerCase().includes(t) ||
        (l.city ?? "").toLowerCase().includes(t) ||
        (l.trade ?? "").toLowerCase().includes(t),
    );
  }, [leads, q]);

  const filteredClients = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return MARKETPLACE_CLIENTS;
    return MARKETPLACE_CLIENTS.filter(
      (c) => c.name.toLowerCase().includes(t) || (c.city ?? "").toLowerCase().includes(t),
    );
  }, [q]);

  const pickLead = (p: EcosystemProject) =>
    onPick("lead", {
      clientName:
        (p.city ? `Homeowner · ${p.city}` : `Homeowner · ${p.locationZip}`) || "Homeowner",
      jobTitle: p.title,
      description: [
        p.description,
        p.desiredStart ? `Desired start: ${p.desiredStart}` : null,
        p.trade ? `Trade: ${p.trade}` : null,
        p.budgetTotal ? `Budget: €${p.budgetTotal.toLocaleString("de-DE")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      sourceLabel: `Marketplace lead · ${p.locationZip}${p.city ? ` ${p.city}` : ""}`,
    });

  const pickClient = (c: MarketplaceClient) =>
    onPick("client", {
      clientName: c.name,
      clientEmail: c.email,
      sourceLabel: `Client · ${c.name}`,
    });

  return (
    <div className="space-y-4 px-5 py-5">
      <div className="grid grid-cols-3 gap-2">
        <SourceTile
          active={tab === "lead"}
          icon={Sparkles}
          label="Marketplace lead"
          hint={`${leads.length} open`}
          onClick={() => setTab("lead")}
        />
        <SourceTile
          active={tab === "client"}
          icon={Users}
          label="Matched client"
          hint={`${MARKETPLACE_CLIENTS.length} in book`}
          onClick={() => setTab("client")}
        />
        <SourceTile
          active={tab === "manual"}
          icon={PencilLine}
          label="Manual"
          hint="Start blank"
          onClick={() => onPick("manual")}
        />
      </div>

      {tab !== "manual" && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "lead"
                ? "Search leads by title, city, trade"
                : "Search clients by name or city"
            }
            className="border-white/10 bg-white/5 pl-9 text-slate-100 placeholder:text-slate-400"
          />
        </div>
      )}

      {tab === "lead" && (
        <div className="space-y-2">
          {filteredLeads.length === 0 ? (
            <PickerEmpty
              icon={Sparkles}
              title="No matched leads right now"
              hint="Open leads from the marketplace will show up here. You can still start a manual quote."
              cta="Start manual quote"
              onCta={() => onPick("manual")}
            />
          ) : (
            filteredLeads.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickLead(p)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-orange-400/40 hover:bg-orange-500/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-orange-glow">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Lead
                      {p.trade ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-slate-300">
                          {p.trade}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-semibold text-white">
                      {p.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {p.locationZip}
                      {p.city ? ` · ${p.city}` : ""}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">{p.description}</p>
                  </div>
                  <div className="text-right text-xs">
                    {p.budgetTotal ? (
                      <div className="font-semibold text-orange-glow">
                        €{p.budgetTotal.toLocaleString("de-DE")}
                      </div>
                    ) : null}
                    <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === "client" && (
        <div className="space-y-2">
          {filteredClients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickClient(c)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-orange-400/40 hover:bg-orange-500/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {c.type === "eu_business"
                      ? "EU business"
                      : c.type === "business"
                        ? "Business"
                        : "Private"}
                  </div>
                  <div className="mt-0.5 truncate text-sm font-semibold text-white">{c.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">
                    {[c.street, c.postcode, c.city].filter(Boolean).join(" · ")}
                  </div>
                  {c.email ? (
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">{c.email}</div>
                  ) : null}
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
