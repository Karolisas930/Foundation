import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getMyContractorStatus, listNetworkThreads } from "@/lib/network-chat.functions";
import { ContractorSearch } from "./ContractorSearch";
import { NetworkBadge } from "./NetworkBadge";
import type { ReactNode } from "react";

export function NetworkChatPage({
  activeThreadId,
  children,
}: {
  activeThreadId?: string;
  children?: ReactNode;
}) {
  const statusFn = useServerFn(getMyContractorStatus);
  const listFn = useServerFn(listNetworkThreads);

  const status = useQuery({ queryKey: ["contractor-status"], queryFn: () => statusFn() });
  const threads = useQuery({
    queryKey: ["network-threads"],
    queryFn: () => listFn(),
    enabled: !!status.data?.isVerifiedContractor,
  });

  if (status.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Checking your trade profile…
      </div>
    );
  }

  if (!status.data?.isVerifiedContractor) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-8 text-center">
        <NetworkBadge />
        <h1 className="text-xl font-semibold text-foreground">Trade Network is contractor-only</h1>
        <p className="text-sm text-muted-foreground">
          Verify your tradesperson profile to message other regional contractors. Client
          conversations remain in your regular inbox and are never mixed here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-4 overflow-y-auto border-r border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Trade Network</h2>
          <NetworkBadge />
        </div>

        <ContractorSearch />

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </h3>
          {threads.data?.threads?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No B2B threads yet. Search a contractor to start.
            </p>
          )}
          <ul className="space-y-1">
            {threads.data?.threads?.map((t: any) => {
              const active = t.id === activeThreadId;
              const peerName = t.peer?.display_name || t.peer?.full_name || "Contractor";
              return (
                <li key={t.id}>
                  <Link
                    to="/contractor/network/$threadId"
                    params={{ threadId: t.id }}
                    className={`block rounded-md px-2 py-2 text-sm ${
                      active
                        ? "bg-secondary text-secondary-foreground"
                        : "text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <div className="truncate font-medium">{peerName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.lastMessage?.body || "No messages yet"}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col overflow-hidden bg-background">
        {children ?? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Select a thread or find a contractor to start a B2B conversation.
          </div>
        )}
      </main>
    </div>
  );
}
