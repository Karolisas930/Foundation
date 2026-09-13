/**
 * Queries public profiles via listPublicProfiles (safe columns only, no
 * auth required) and renders them as cards linking to /p/:profileId —
 * the same public profile page contact requests/quotes already use.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import { listPublicProfiles, type PublicProfile } from "@/lib/privacy-gate.functions";

export function TradespersonBrowseList({ search }: { search: string }) {
  const listPublicProfilesFn = useServerFn(listPublicProfiles);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["public-profiles", debouncedSearch],
    queryFn: () => listPublicProfilesFn({ data: { search: debouncedSearch || undefined } }),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading tradespeople…</p>;
  }

  if (!profiles?.length) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        No tradespeople found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}. Try a different
        trade or city.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profiles.map((p: PublicProfile) => (
        <Link
          key={p.id}
          to="/p/$profileId"
          params={{ profileId: p.id }}
          className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-orange-glow"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
              <Building2 className="h-5 w-5 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {p.business_name ?? "Tradesperson"}
              </p>
              {p.trade ? <p className="truncate text-sm text-slate-300">{p.trade}</p> : null}
              {p.city ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {p.city}
                </p>
              ) : null}
              {p.bio ? <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.bio}</p> : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
