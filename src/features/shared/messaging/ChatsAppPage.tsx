import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { cn } from "@/lib/utils";
import { PendingMatchesStrip } from "@/features/shared/messaging/PendingMatchesStrip";
import { MatchUnlockInbox } from "@/features/shared/matches/components/MatchUnlockInbox";
import { NetworkDirectory } from "@/features/shared/messaging/NetworkDirectory";
import { ChatWindow, type ChatPeer } from "@/features/shared/messaging/ChatWindow";
import { listClientThreads } from "@/lib/client-chat.functions";
import { ShieldCheck, Lock, Search, Users, Network } from "lucide-react";

const PASSCODE = "1234";
const STORAGE_KEY = "chats_unlocked_v1";

export function ChatsAppPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-50">
      <TopBar />
      <div className="pb-24">
        {unlocked ? (
          <ChatDashboard />
        ) : (
          <PasscodeLock
            onUnlock={() => {
              localStorage.setItem(STORAGE_KEY, "1");
              setUnlocked(true);
            }}
          />
        )}
      </div>
      <BottomBar />
    </div>
  );
}

/* ------------------------------- Passcode ------------------------------- */

function PasscodeLock({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError(false);
    if (clean && i < 3) refs[i + 1].current?.focus();
    if (next.every((d) => d !== "")) {
      const code = next.join("");
      setTimeout(() => {
        if (code === PASSCODE) onUnlock();
        else {
          setError(true);
          setDigits(["", "", "", ""]);
          refs[0].current?.focus();
        }
      }, 120);
    }
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative mb-6">
        <div
          className="absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--orange-glow) 40%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(255,120,20,0.5)]">
          <Lock className="h-9 w-9 text-orange-glow" strokeWidth={2.25} />
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Enter Chat Passcode</h1>
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        End-to-end encrypted · Only you can unlock
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "h-16 w-16 rounded-full border text-center text-2xl font-bold caret-transparent",
              "bg-slate-900/60 backdrop-blur transition-all",
              "focus:outline-none focus:ring-4 focus:ring-orange-glow/30",
              error
                ? "border-red-500/70 text-red-300 animate-[shake_0.4s]"
                : d
                  ? "border-orange-glow text-orange-glow shadow-[0_0_20px_-6px_rgba(255,140,40,0.7)]"
                  : "border-white/10 text-slate-50",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-400">Incorrect passcode. Try again.</p>
      )}

      <button
        type="button"
        className="mt-8 text-sm font-medium text-slate-400 underline-offset-4 hover:text-orange-glow hover:underline"
        onClick={() => alert("Recovery link sent to your registered email.")}
      >
        Forgot passcode?
      </button>

      <p className="mt-10 text-[11px] uppercase tracking-widest text-slate-600">
        Demo passcode: 1234
      </p>
    </main>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

type TabKey = "clients" | "network";

function ChatDashboard() {
  const [tab, setTab] = useState<TabKey>("clients");
  const [openPeer, setOpenPeer] = useState<ChatPeer | null>(null);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6">
      {/* Tabs */}
      <div className="rounded-2xl bg-slate-900/60 p-1.5 ring-1 ring-white/5 backdrop-blur">
        <div className="grid grid-cols-2 gap-1">
          <TabBtn
            active={tab === "clients"}
            onClick={() => setTab("clients")}
            icon={<Users className="h-4 w-4" />}
            label="Clients"
          />
          <TabBtn
            active={tab === "network"}
            onClick={() => setTab("network")}
            icon={<Network className="h-4 w-4" />}
            label="Network (B2B)"
          />
        </div>
      </div>

      {/* Search (Clients only — Network tab has its own smart search) */}
      {tab === "clients" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-900/60 px-4 py-3 ring-1 ring-white/5">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            placeholder="Search clients…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      )}

      {/* Privacy Serializer Gate — accept matches to unlock contact fields */}
      <PendingMatchesStrip />

      {/* Match-Unlocked Contact Reveal — accept → confirm → reveal */}
      <MatchUnlockInbox />

      <div className="mt-4">
        {tab === "clients" ? <ClientsList onOpen={(c) => setOpenPeer(c)} /> : <NetworkDirectory />}
      </div>

      {openPeer && <ChatWindow peer={openPeer} onClose={() => setOpenPeer(null)} />}
    </main>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
        active
          ? "bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_24px_-8px_rgba(255,140,40,0.6)]"
          : "text-slate-300 hover:text-white",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* --------------------------------- Data ---------------------------------- */

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString();
}

function ClientsList({ onOpen }: { onOpen: (c: ChatPeer) => void }) {
  const list = useServerFn(listClientThreads);
  const q = useQuery({
    queryKey: ["client-threads"],
    queryFn: () => list(),
    refetchInterval: 15_000,
  });

  if (q.isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500 ring-1 ring-white/5">
        Loading conversations…
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-2xl bg-red-950/40 px-4 py-6 text-center text-sm text-red-300 ring-1 ring-red-500/30">
        Couldn't load your messages. Sign in and accept a match to start chatting.
      </div>
    );
  }

  const threads = q.data?.threads ?? [];
  if (!threads.length) {
    return (
      <div className="rounded-2xl bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-white/5">
        No conversations yet. Once a match is unlocked, it will appear here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
      {threads.map((t) => {
        const name = t.peer?.display_name || t.peer?.full_name || "Client";
        const avatar =
          t.peer?.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        const preview = t.lastMessage?.body ?? "Say hi 👋";
        return (
          <li
            key={t.matchId}
            onClick={() =>
              onOpen({
                id: t.peerId,
                matchId: t.matchId,
                name,
                avatar,
                subtitle: t.peer?.city ?? "",
              })
            }
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/5 active:bg-white/10"
          >
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-bold text-slate-50">{name}</p>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                  {relativeTime(t.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-slate-400">{preview}</p>
                {t.unread ? (
                  <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-orange-glow px-1.5 text-[10px] font-bold text-white">
                    {t.unread}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* B2B network directory lives in ./NetworkDirectory.tsx */

export default ChatsAppPage;
