import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getNetworkThread,
  markNetworkThreadRead,
  sendNetworkMessage,
} from "@/lib/network-chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { NetworkBadge } from "./NetworkBadge";

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export function NetworkThreadView({
  threadId,
  currentUserId,
}: {
  threadId: string;
  currentUserId: string;
}) {
  const getFn = useServerFn(getNetworkThread);
  const sendFn = useServerFn(sendNetworkMessage);
  const readFn = useServerFn(markNetworkThreadRead);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["network-thread", threadId],
    queryFn: () => getFn({ data: { threadId } }),
  });

  const send = useMutation({
    mutationFn: (body: string) => sendFn({ data: { threadId, body } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["network-thread", threadId] });
      qc.invalidateQueries({ queryKey: ["network-threads"] });
    },
  });

  // Realtime — dedicated topic, isolated from client (booking) channels
  useEffect(() => {
    const channel = supabase
      .channel(`network:thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "network_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["network-thread", threadId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, qc]);

  useEffect(() => {
    readFn({ data: { threadId } }).catch(() => {});
  }, [threadId, readFn, query.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query.data?.messages?.length]);

  const peer = (query.data?.peers as any[] | undefined)?.[0];
  const peerName = peer?.display_name || peer?.full_name || "Contractor";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{peerName}</div>
          <div className="text-xs text-muted-foreground">
            {peer?.city || "Trade network partner"}
          </div>
        </div>
        <NetworkBadge />
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {(query.data?.messages as Message[] | undefined)?.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (body) send.mutate(body);
        }}
        className="flex gap-2 border-t border-border bg-card p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message a fellow contractor…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={send.isPending || !draft.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
