import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MapPin,
  MoreVertical,
  Smile,
  Check,
  CheckCheck,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getClientThread,
  sendClientMessage,
  markClientThreadRead,
} from "@/lib/client-chat.functions";

export type ChatPeer = {
  id: string;
  /** matches.id — when present, the composer talks to the DB. */
  matchId?: string;
  name: string;
  avatar: string;
  online?: boolean;
  subtitle?: string;
};

type Msg =
  | { id: string; mine: boolean; kind: "text"; body: string; time: string; read?: boolean }
  | { id: string; mine: boolean; kind: "image"; url: string; time: string; read?: boolean }
  | {
      id: string;
      mine: boolean;
      kind: "file";
      name: string;
      size: string;
      time: string;
      read?: boolean;
    }
  | { id: string; mine: boolean; kind: "voice"; duration: string; time: string; read?: boolean }
  | { id: string; mine: boolean; kind: "location"; label: string; time: string; read?: boolean };

const DEMO_SEED: Msg[] = [
  {
    id: "s1",
    mine: false,
    kind: "text",
    body: "Hallo! Können Sie am Freitag vorbeikommen?",
    time: "09:12",
  },
  {
    id: "s2",
    mine: true,
    kind: "text",
    body: "Ja klar — 10 Uhr passt.",
    time: "09:14",
    read: true,
  },
];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({ peer, onClose }: { peer: ChatPeer; onClose: () => void }) {
  const qc = useQueryClient();
  const getThread = useServerFn(getClientThread);
  const sendMsg = useServerFn(sendClientMessage);
  const markRead = useServerFn(markClientThreadRead);

  const live = Boolean(peer.matchId);

  const thread = useQuery({
    queryKey: ["client-thread", peer.matchId],
    queryFn: () => getThread({ data: { matchId: peer.matchId! } }),
    enabled: live,
    refetchInterval: 8_000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMsg({ data: { matchId: peer.matchId!, body } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["client-thread", peer.matchId] });
      void qc.invalidateQueries({ queryKey: ["client-threads"] });
    },
  });

  // Mark thread read on open + whenever new messages land.
  useEffect(() => {
    if (!live) return;
    void markRead({ data: { matchId: peer.matchId! } }).then(() => {
      void qc.invalidateQueries({ queryKey: ["client-threads"] });
    });
  }, [live, peer.matchId, thread.data?.messages.length, markRead, qc]);

  const messages: Msg[] = useMemo(() => {
    if (!live) return DEMO_SEED;
    const rows = thread.data?.messages ?? [];
    return rows.map((m) => ({
      id: m.id,
      mine: m.sender_id !== peer.id,
      kind: "text" as const,
      body: m.body,
      time: fmtTime(m.created_at),
      read: Boolean(m.read_at),
    }));
  }, [live, thread.data, peer.id]);

  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Local echo for attachments / voice / location — these still go to
  // local-only state until file storage is wired (out of scope for Phase 4).
  const [localExtras, setLocalExtras] = useState<Msg[]>([]);
  const merged = useMemo(() => [...messages, ...localExtras], [messages, localExtras]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [merged.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const now = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const pushLocal = (m: Omit<Msg, "id" | "mine" | "time" | "read"> & Partial<Msg>) => {
    setLocalExtras((prev) => [
      ...prev,
      { id: crypto.randomUUID(), mine: true, time: now(), read: false, ...(m as any) } as Msg,
    ]);
  };

  const sendText = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    if (live) {
      sendMutation.mutate(body);
    } else {
      pushLocal({ kind: "text", body });
    }
  };

  const onPickFiles = (list: FileList | null, kind: "image" | "file") => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      if (kind === "image") {
        const url = URL.createObjectURL(f);
        pushLocal({ kind: "image", url });
      } else {
        pushLocal({
          kind: "file",
          name: f.name,
          size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        });
      }
    });
  };

  const toggleVoice = () => {
    if (recording) {
      setRecording(false);
      pushLocal({ kind: "voice", duration: "0:07" });
    } else {
      setRecording(true);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      pushLocal({ kind: "location", label: "Ludwigsburg, DE" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        pushLocal({
          kind: "location",
          label: `📍 ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
        }),
      () => pushLocal({ kind: "location", label: "📍 Standort geteilt" }),
      { timeout: 4000 },
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0b1220] text-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/5 bg-slate-900/90 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="-ml-1 rounded-full p-2 text-slate-200 hover:bg-white/10 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative shrink-0">
          <img
            src={peer.avatar}
            alt={peer.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
          />
          {peer.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{peer.name}</p>
          <p className="truncate text-[11px] text-slate-400">
            {peer.online ? (
              <>
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />{" "}
                Online now
              </>
            ) : (
              (peer.subtitle ?? "Tap for info")
            )}
          </p>
        </div>
        <button className="rounded-full p-2 text-slate-300 hover:bg-white/5" aria-label="More">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,140,40,0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(59,130,246,0.05), transparent 40%)",
        }}
      >
        {merged.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>

      {/* Composer */}
      <footer className="border-t border-white/5 bg-slate-900/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        {showEmoji && !recording && (
          <div className="mb-2 grid grid-cols-8 gap-1 rounded-2xl bg-slate-800/70 p-2 ring-1 ring-white/5">
            {[
              "👍",
              "🙏",
              "✅",
              "🔥",
              "😂",
              "❤️",
              "👌",
              "💪",
              "🛠️",
              "🚚",
              "📸",
              "📍",
              "⏰",
              "💶",
              "🙌",
              "🤝",
            ].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setDraft((d) => d + e);
                  inputRef.current?.focus();
                }}
                className="rounded-lg py-1.5 text-xl hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        {recording ? (
          <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/40">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-sm font-medium text-red-200">Recording voice note…</span>
            <button
              onClick={toggleVoice}
              className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              <Square className="h-3 w-3 fill-white" /> Stop &amp; send
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <div className="flex flex-1 items-end gap-1 rounded-3xl bg-slate-800/80 px-2 py-1.5 ring-1 ring-white/5 focus-within:ring-orange-glow/50">
              <ComposerBtn label="Emoji" onClick={() => setShowEmoji((s) => !s)}>
                <Smile className="h-5 w-5" />
              </ComposerBtn>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setShowEmoji(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                rows={1}
                placeholder="Nachricht schreiben…"
                className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <ComposerBtn label="Send image" onClick={() => imgRef.current?.click()}>
                <ImageIcon className="h-5 w-5" />
              </ComposerBtn>
              <ComposerBtn label="Attach file" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-5 w-5" />
              </ComposerBtn>
              <ComposerBtn label="Share location" onClick={shareLocation}>
                <MapPin className="h-5 w-5" />
              </ComposerBtn>
            </div>

            {draft.trim() ? (
              <button
                onClick={sendText}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_24px_-8px_rgba(255,140,40,0.7)] active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={toggleVoice}
                aria-label="Record voice"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_24px_-8px_rgba(255,140,40,0.7)] active:scale-95"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            onPickFiles(e.target.files, "file");
            e.target.value = "";
          }}
        />
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onPickFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />
      </footer>
    </div>
  );
}

function ComposerBtn({
  children,
  onClick,
  label,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95",
        accent
          ? "bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_24px_-8px_rgba(255,140,40,0.7)]"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function MessageBubble({ m }: { m: Msg }) {
  const align = m.mine ? "justify-end" : "justify-start";
  const bubble = m.mine
    ? "bg-gradient-to-br from-orange-glow to-orange-500 text-white rounded-br-md"
    : "bg-slate-800 text-slate-100 rounded-bl-md";
  return (
    <div className={cn("flex", align)}>
      <div className={cn("max-w-[78%] rounded-2xl px-3 py-2 shadow-sm", bubble)}>
        {m.kind === "text" && <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
        {m.kind === "image" && (
          <img src={m.url} alt="attachment" className="max-h-64 rounded-lg object-cover" />
        )}
        {m.kind === "file" && (
          <div className="flex items-center gap-2 py-1">
            <Paperclip className="h-4 w-4 opacity-80" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="text-[11px] opacity-70">{m.size}</p>
            </div>
          </div>
        )}
        {m.kind === "voice" && (
          <div className="flex items-center gap-2 py-1">
            <Mic className="h-4 w-4" />
            <div className="h-1.5 w-32 rounded-full bg-white/30">
              <div className="h-full w-1/2 rounded-full bg-white/80" />
            </div>
            <span className="text-xs opacity-80">{m.duration}</span>
          </div>
        )}
        {m.kind === "location" && (
          <div className="flex items-center gap-2 py-1">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{m.label}</span>
          </div>
        )}
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            m.mine ? "justify-end text-white/80" : "text-slate-400",
          )}
        >
          <span>{m.time}</span>
          {m.mine && (m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
