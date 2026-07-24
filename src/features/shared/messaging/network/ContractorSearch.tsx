import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { searchContractors, startNetworkThread } from "@/lib/network-chat.functions";

type Contractor = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  trades: string[] | null;
};

export function ContractorSearch() {
  const searchFn = useServerFn(searchContractors);
  const startFn = useServerFn(startNetworkThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [trade, setTrade] = useState("");
  const [submitted, setSubmitted] = useState<{ q: string; city: string; trade: string } | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["contractor-search", submitted],
    queryFn: () => searchFn({ data: submitted ?? {} }),
    enabled: submitted !== null,
  });

  const start = useMutation({
    mutationFn: (peerUserId: string) => startFn({ data: { peerUserId } }),
    onSuccess: ({ threadId }) => {
      qc.invalidateQueries({ queryKey: ["network-threads"] });
      navigate({ to: "/contractor/network/$threadId", params: { threadId } });
    },
  });

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted({ q, city, trade });
        }}
        className="space-y-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name or company"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder="Trade (e.g. Elektriker)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search trade network
        </button>
      </form>

      <div className="space-y-1">
        {query.isFetching && <p className="text-xs text-muted-foreground">Searching…</p>}
        {query.data?.results?.length === 0 && (
          <p className="text-xs text-muted-foreground">No contractors matched.</p>
        )}
        {(query.data?.results as Contractor[] | undefined)?.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {c.display_name || c.full_name || "Unnamed contractor"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {[c.city, (c.trades ?? []).slice(0, 2).join(", ")].filter(Boolean).join(" · ") ||
                  "Contractor"}
              </div>
            </div>
            <button
              onClick={() => start.mutate(c.id)}
              disabled={start.isPending}
              className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
