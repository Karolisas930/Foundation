import { Link } from "@tanstack/react-router";
import { CalendarDays, Handshake, MessageSquare, PlusCircle, type Wrench } from "lucide-react";

export function QuickActionsBar({ onScrollToBids }: { onScrollToBids: () => void }) {
  const actions: Array<{
    label: string;
    icon: typeof Wrench;
    to?: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    onClick?: () => void;
  }> = [
    {
      label: "Post project",
      icon: PlusCircle,
      to: "/onboarding/profile",
      search: { sector: "homeowner" },
    },
    { label: "Review bids", icon: Handshake, onClick: onScrollToBids },
    { label: "Messages", icon: MessageSquare, to: "/chats" },
    { label: "Calendar", icon: CalendarDays, to: "/contractor/calendar" },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((a) => {
        const base =
          "group inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-100 transition-all hover:-translate-y-[1px] hover:border-orange/40 hover:bg-orange/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50";
        const content = (
          <>
            <a.icon className="size-4 text-orange transition-transform group-hover:scale-110" />
            {a.label}
          </>
        );
        if (a.to) {
          return (
            <Link
              key={a.label}
              to={a.to as never}
              {...(a.params ? { params: a.params as never } : {})}
              {...(a.search ? { search: a.search as never } : {})}
              className={base}
            >
              {content}
            </Link>
          );
        }
        return (
          <button key={a.label} type="button" onClick={a.onClick} className={base}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
