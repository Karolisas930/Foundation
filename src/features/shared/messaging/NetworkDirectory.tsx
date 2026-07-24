import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Lock,
  MapPin,
  MessageSquarePlus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Data ---- */

/**
 * The logged-in pro's trade. In production this comes from the auth/profile
 * store; for the demo we default to "Elektro" so the smart-match surfaces
 * drywallers, painters and scaffolders at the top of the feed.
 */
const CURRENT_PRO = {
  trade: "Elektro",
  city: "Ludwigsburg",
} as const;

/**
 * Complementary trade graph. When viewing the network as trade X, these
 * are the trades most often needed together on a build site and are
 * boosted to the top of the local feed.
 */
const COMPLEMENTARY: Record<string, string[]> = {
  Elektro: ["Trockenbau", "Maler", "Gerüstbau"],
  Trockenbau: ["Elektro", "Maler", "Sanitär"],
  Maler: ["Trockenbau", "Gerüstbau", "Bodenleger"],
  Gerüstbau: ["Dachdecker", "Maler", "Maurer"],
  Sanitär: ["Fliesenleger", "Trockenbau", "Elektro"],
  Dachdecker: ["Gerüstbau", "Zimmerer", "Spengler"],
};

type Trade = { de: string; en: string; emoji: string };

const TRADES: Trade[] = [
  { de: "Alle", en: "All", emoji: "🧰" },
  { de: "Gerüstbau", en: "Scaffolding", emoji: "🏗️" },
  { de: "Trockenbau", en: "Drywalling", emoji: "🧱" },
  { de: "Elektro", en: "Electrical", emoji: "⚡" },
  { de: "Sanitär", en: "Plumbing", emoji: "🔧" },
  { de: "Dachdecker", en: "Roofing", emoji: "🏠" },
  { de: "Maler", en: "Painting", emoji: "🎨" },
  { de: "Fliesenleger", en: "Tiling", emoji: "🟫" },
  { de: "Bodenleger", en: "Flooring", emoji: "🪵" },
];

type Pro = {
  id: string;
  company: string;
  owner: string;
  trade: string;
  tradeEn: string;
  avatar: string;
  city: string;
  distanceKm: number;
  online: "online" | "away" | "offline";
  verified: boolean;
  yearsActive: number;
  availability: string;
  rating: number;
  jobsDone: number;
};

const PROS: Pro[] = [
  {
    id: "p1",
    company: "Bauer Trockenbau GmbH",
    owner: "Lukas Bauer",
    trade: "Trockenbau",
    tradeEn: "Drywalling",
    avatar: "https://i.pravatar.cc/160?img=52",
    city: "Ludwigsburg",
    distanceKm: 3,
    online: "online",
    verified: true,
    yearsActive: 12,
    availability: "Verfügbar für Subunternehmer-Aufträge",
    rating: 4.9,
    jobsDone: 214,
  },
  {
    id: "p2",
    company: "Meyer Malerbetrieb",
    owner: "Sofia Meyer",
    trade: "Maler",
    tradeEn: "Painting",
    avatar: "https://i.pravatar.cc/160?img=45",
    city: "Kornwestheim",
    distanceKm: 6,
    online: "online",
    verified: true,
    yearsActive: 9,
    availability: "Freie Kapazität ab nächster Woche",
    rating: 4.8,
    jobsDone: 168,
  },
  {
    id: "p3",
    company: "Wolf Gerüstbau UG",
    owner: "Jonas Wolf",
    trade: "Gerüstbau",
    tradeEn: "Scaffolding",
    avatar: "https://i.pravatar.cc/160?img=13",
    city: "Bietigheim",
    distanceKm: 9,
    online: "away",
    verified: true,
    yearsActive: 15,
    availability: "Gerüst verleihbar · schnelle Montage",
    rating: 4.7,
    jobsDone: 302,
  },
  {
    id: "p4",
    company: "Roth Sanitär & Heizung",
    owner: "Mila Roth",
    trade: "Sanitär",
    tradeEn: "Plumbing",
    avatar: "https://i.pravatar.cc/160?img=36",
    city: "Ludwigsburg",
    distanceKm: 4,
    online: "online",
    verified: true,
    yearsActive: 11,
    availability: "Notdienst-fähig · Werkzeug teilbar",
    rating: 5.0,
    jobsDone: 190,
  },
  {
    id: "p5",
    company: "König Dachdeckerei",
    owner: "David König",
    trade: "Dachdecker",
    tradeEn: "Roofing",
    avatar: "https://i.pravatar.cc/160?img=17",
    city: "Marbach",
    distanceKm: 12,
    online: "offline",
    verified: true,
    yearsActive: 18,
    availability: "Sucht Gerüstbau-Partner für Q3",
    rating: 4.6,
    jobsDone: 421,
  },
  {
    id: "p6",
    company: "Lang Malerwerkstatt",
    owner: "Eva Lang",
    trade: "Maler",
    tradeEn: "Painting",
    avatar: "https://i.pravatar.cc/160?img=40",
    city: "Asperg",
    distanceKm: 7,
    online: "online",
    verified: false,
    yearsActive: 4,
    availability: "Verfügbar für Subunternehmer-Aufträge",
    rating: 4.9,
    jobsDone: 58,
  },
  {
    id: "p7",
    company: "Krause Elektro",
    owner: "Tim Krause",
    trade: "Elektro",
    tradeEn: "Electrical",
    avatar: "https://i.pravatar.cc/160?img=68",
    city: "Ludwigsburg",
    distanceKm: 2,
    online: "online",
    verified: true,
    yearsActive: 7,
    availability: "Sucht Backup bei Großbaustelle",
    rating: 4.8,
    jobsDone: 133,
  },
  {
    id: "p8",
    company: "Fischer Fliesen",
    owner: "Rea Fischer",
    trade: "Fliesenleger",
    tradeEn: "Tiling",
    avatar: "https://i.pravatar.cc/160?img=48",
    city: "Stuttgart-Nord",
    distanceKm: 14,
    online: "away",
    verified: true,
    yearsActive: 13,
    availability: "Kann Material mitliefern",
    rating: 4.9,
    jobsDone: 276,
  },
  {
    id: "p9",
    company: "Neumann Bodenleger",
    owner: "Alex Neumann",
    trade: "Bodenleger",
    tradeEn: "Flooring",
    avatar: "https://i.pravatar.cc/160?img=60",
    city: "Bietigheim",
    distanceKm: 10,
    online: "offline",
    verified: true,
    yearsActive: 8,
    availability: "Verfügbar ab KW 34",
    rating: 4.7,
    jobsDone: 121,
  },
  // ---- Guaranteed local BW fallback profiles (render even when Supabase is offline) ----
  {
    id: "fallback-mueller",
    company: "Müller Gerüstbau GmbH",
    owner: "Hans Müller",
    trade: "Gerüstbau",
    tradeEn: "Scaffolding",
    avatar: "https://i.pravatar.cc/160?img=12",
    city: "Ludwigsburg",
    distanceKm: 8,
    online: "online",
    verified: true,
    yearsActive: 22,
    availability: "Verfügbar · Gerüst kurzfristig lieferbar",
    rating: 4.9,
    jobsDone: 512,
  },
  {
    id: "fallback-maler",
    company: "Stuttgart Maler & Lackierer",
    owner: "Andrea Vogt",
    trade: "Maler",
    tradeEn: "Painting",
    avatar: "https://i.pravatar.cc/160?img=32",
    city: "Stuttgart Mitte",
    distanceKm: 3,
    online: "away",
    verified: true,
    yearsActive: 17,
    availability: "Beschäftigt · Anfragen ab nächster Woche",
    rating: 4.8,
    jobsDone: 388,
  },
  {
    id: "fallback-kunz",
    company: "Kunz Bedachungen",
    owner: "Peter Kunz",
    trade: "Dachdecker",
    tradeEn: "Roofing",
    avatar: "https://i.pravatar.cc/160?img=15",
    city: "Esslingen",
    distanceKm: 14,
    online: "online",
    verified: true,
    yearsActive: 25,
    availability: "Verfügbar für Subunternehmer-Aufträge",
    rating: 4.9,
    jobsDone: 604,
  },
];

/* ---------------------------------------------------------- Component ---- */

export function NetworkDirectory() {
  const [activeTrade, setActiveTrade] = useState<string>("Alle");
  const [query, setQuery] = useState("");
  const [chatPro, setChatPro] = useState<Pro | null>(null);

  const complementary = COMPLEMENTARY[CURRENT_PRO.trade] ?? [];

  const results = useMemo(() => {
    try {
      const q = query.trim().toLowerCase();
      const filtered = (PROS ?? []).filter((p) => {
        if (!p) return false;
        if (activeTrade !== "Alle" && p?.trade !== activeTrade) return false;
        if (!q) return true;
        return (
          p?.company?.toLowerCase().includes(q) ||
          p?.owner?.toLowerCase().includes(q) ||
          p?.trade?.toLowerCase().includes(q) ||
          p?.tradeEn?.toLowerCase().includes(q) ||
          p?.city?.toLowerCase().includes(q)
        );
      });

      return [...filtered].sort((a, b) => {
        const aScore =
          (complementary?.includes(a?.trade) ? -100 : 0) +
          (a?.city === CURRENT_PRO.city ? -25 : 0) +
          (a?.distanceKm ?? 999);
        const bScore =
          (complementary?.includes(b?.trade) ? -100 : 0) +
          (b?.city === CURRENT_PRO.city ? -25 : 0) +
          (b?.distanceKm ?? 999);
        return aScore - bScore;
      });
    } catch (err) {
      console.warn("[NetworkDirectory] filter/sort failed, using raw list:", err);
      return PROS ?? [];
    }
  }, [activeTrade, query, complementary]);

  // Group by trade for section headings when viewing "Alle".
  const grouped = useMemo(() => {
    if (activeTrade !== "Alle") return null;
    const map = new Map<string, Pro[]>();
    for (const p of results) {
      const list = map.get(p.trade) ?? [];
      list.push(p);
      map.set(p.trade, list);
    }
    // Preserve smart-match ordering: iterate trades in the order they first appear.
    return Array.from(map.entries());
  }, [activeTrade, results]);

  return (
    <div className="space-y-4">
      {/* Smart-match banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-3 backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-glow/30 to-orange-500/10 ring-1 ring-orange-glow/40">
          <Sparkles className="h-4 w-4 text-orange-glow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-100">
            Smart-Match für {CURRENT_PRO.trade} · {CURRENT_PRO.city}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            Ergänzende Gewerke zuerst: {complementary.join(" · ") || "—"}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 sm:inline-flex">
          <ShieldCheck className="h-3 w-3" /> E2E
        </span>
      </div>

      {/* Search + trade filter */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Firma, Gewerk oder Stadt suchen…"
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {TRADES.map((t) => {
            const active = activeTrade === t.de;
            const isComplement = complementary.includes(t.de);
            return (
              <button
                key={t.de}
                type="button"
                onClick={() => {
                  try {
                    setActiveTrade(t?.de ?? "Alle");
                  } catch (err) {
                    console.warn("[NetworkDirectory] tab switch failed:", err);
                  }
                }}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                  active
                    ? "bg-gradient-to-r from-orange-glow to-orange-500 text-white shadow-[0_8px_20px_-8px_rgba(255,140,40,0.6)]"
                    : "border border-white/10 bg-slate-900/60 text-slate-300 backdrop-blur hover:text-white",
                  !active && isComplement && "ring-1 ring-orange-glow/40",
                )}
              >
                <span className="mr-1">{t.emoji}</span>
                {t.de}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory feed */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
          Keine passenden Betriebe gefunden.
        </div>
      ) : grouped ? (
        <div className="space-y-5">
          {grouped.map(([trade, list]) => (
            <section key={trade}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {trade}
                  {complementary.includes(trade) && (
                    <span className="ml-2 rounded-full bg-orange-glow/15 px-2 py-0.5 text-[9px] font-bold text-orange-glow ring-1 ring-orange-glow/30">
                      EMPFOHLEN
                    </span>
                  )}
                </h3>
                <span className="text-[10px] font-medium text-slate-500">
                  {list.length} {list.length === 1 ? "Betrieb" : "Betriebe"}
                </span>
              </div>
              <ul className="space-y-2">
                {list.map((p) => (
                  <ProCard key={p.id} pro={p} onMessage={() => setChatPro(p)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((p) => (
            <ProCard key={p.id} pro={p} onMessage={() => setChatPro(p)} />
          ))}
        </ul>
      )}

      {chatPro && <B2BChatOverlay pro={chatPro} onClose={() => setChatPro(null)} />}
    </div>
  );
}

/* --------------------------------------------------------------- Card ---- */

function ProCard({ pro, onMessage }: { pro: Pro; onMessage: () => void }) {
  const statusColor =
    pro.online === "online"
      ? "bg-emerald-400"
      : pro.online === "away"
        ? "bg-amber-400"
        : "bg-slate-500";

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 p-3 backdrop-blur-xl transition-all",
        "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40",
        "hover:border-orange-glow/30 hover:shadow-[0_18px_40px_-24px_rgba(255,140,40,0.5)]",
      )}
    >
      <div className="relative shrink-0">
        <img
          src={pro.avatar}
          alt={pro.owner}
          className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
        />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-slate-900",
            statusColor,
          )}
          aria-label={pro.online}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-slate-50">{pro.company}</p>
          {pro.verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-label="Verifiziert" />
          )}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-orange-glow/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-glow ring-1 ring-orange-glow/30">
            {pro.trade}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <MapPin className="h-3 w-3" />
            {pro.city} • {pro.distanceKm} km entfernt
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-300">
          <Zap className="h-3 w-3 shrink-0 text-orange-glow" />
          {pro.availability}
        </p>
      </div>

      <button
        type="button"
        onClick={onMessage}
        className={cn(
          "shrink-0 rounded-xl bg-gradient-to-br from-orange-glow to-orange-500 px-3 py-2 text-[11px] font-bold text-white",
          "shadow-[0_10px_24px_-10px_rgba(255,140,40,0.8)] transition active:scale-95 hover:brightness-110",
          "flex items-center gap-1.5",
        )}
        aria-label={`Nachricht senden an ${pro.company}`}
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Nachricht</span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------- Chat overlay ---- */

type ChatMsg = { id: string; from: "me" | "them"; text: string; time: string };

function B2BChatOverlay({ pro, onClose }: { pro: Pro; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: "s1",
      from: "them",
      text: `Servus! ${pro.owner} hier von ${pro.company}. Womit kann ich helfen?`,
      time: "jetzt",
    },
  ]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { id: crypto.randomUUID(), from: "me", text, time: "jetzt" }]);
    setInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl",
          "sm:h-[70vh] sm:rounded-3xl",
          "shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
        )}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-b from-slate-900/80 to-transparent px-4 py-3">
          <img
            src={pro.avatar}
            alt=""
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-bold text-slate-50">{pro.company}</p>
              {pro.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-emerald-300">
              <Lock className="h-3 w-3" />
              End-zu-End verschlüsselt · B2B
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* E2E notice */}
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-200">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Diese Unterhaltung ist Ende-zu-Ende verschlüsselt. Ideal für Werkzeug-Sharing,
            Backup-Anfragen oder das Weitergeben lokaler Leads.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  m.from === "me"
                    ? "rounded-br-md bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_20px_-8px_rgba(255,140,40,0.7)]"
                    : "rounded-bl-md border border-white/10 bg-slate-900/70 text-slate-100 backdrop-blur",
                )}
              >
                <p className="leading-snug">{m.text}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    m.from === "me" ? "text-white/70" : "text-slate-500",
                  )}
                >
                  {m.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-white/10 bg-slate-900/60 p-3 backdrop-blur">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Nachricht an ${pro.owner}…`}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim()}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition active:scale-95",
                input.trim()
                  ? "bg-gradient-to-br from-orange-glow to-orange-500 text-white shadow-[0_8px_20px_-8px_rgba(255,140,40,0.7)]"
                  : "bg-slate-800 text-slate-500",
              )}
              aria-label="Senden"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkDirectory;
