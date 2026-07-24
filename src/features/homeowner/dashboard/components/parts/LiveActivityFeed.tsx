import { useMemo } from "react";
import { Handshake, MessageSquare } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";

export function LiveActivityFeed({
  projects,
  proposals,
  messages,
}: {
  projects: EcosystemProject[];
  proposals: EcosystemProposal[];
  messages: {
    id: string;
    projectId: string;
    senderRole: string;
    text: string;
    timestamp: string;
  }[];
}) {
  const items = useMemo(() => {
    const projectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? "Project";
    const bidEvents = proposals.slice(-6).map((b) => ({
      key: `b-${b.id}`,
      icon: Handshake,
      tint: "text-orange",
      title: `New bid · ${b.company}`,
      sub: `${projectTitle(b.projectId)} · €${(b.labor + b.materials + b.travel).toLocaleString("de-DE")}`,
      time: b.postedAt ?? "now",
    }));
    const msgEvents = messages.slice(-6).map((m) => ({
      key: `m-${m.id}`,
      icon: MessageSquare,
      tint: "text-sky-300",
      title: `${m.senderRole === "homeowner" ? "You" : m.senderRole} · message`,
      sub: m.text,
      time: m.timestamp,
    }));
    return [...bidEvents, ...msgEvents].slice(-8).reverse();
  }, [projects, proposals, messages]);

  if (items.length === 0) return null;

  return (
    <section className="glass-panel mt-4 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
          <span className="live-dot" /> Live activity
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {items.length}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it.key}
            style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            className="stream-in flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-orange/30 hover:bg-white/[0.06]"
          >
            <it.icon className={`mt-0.5 size-3.5 shrink-0 ${it.tint}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-white">{it.title}</div>
              <div className="truncate text-[11px] text-slate-400">{it.sub}</div>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">{it.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
