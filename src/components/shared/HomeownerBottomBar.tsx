
/**
 * HomeownerBottomBar — replaces the contractor's multi-tab BottomBar for
 * homeowner accounts with a single floating round "Messages" button.
 * Shows the same live unread badge the bell icon uses elsewhere.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotifications } from "@/features/shared/notifications/hooks/useUnreadNotifications";

export function HomeownerBottomBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count: unreadCount } = useUnreadNotifications();
  const active = pathname === "/messages";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-end pr-5"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
    >
      <Link
        to="/messages"
        aria-label="Messages"
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full",
          "shadow-[0_8px_24px_-6px_rgba(15,23,42,0.35)] transition active:scale-95",
          active
            ? "bg-orange-glow text-white"
            : "bg-white text-slate-900 dark:bg-slate-900 dark:text-white",
          "border border-slate-100 dark:border-slate-800",
        )}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2.25} />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute -right-1 -top-1 grid min-h-[20px] min-w-[20px] place-items-center",
              "rounded-full px-1 text-[11px] font-black leading-none text-white",
              "bg-amber-500 ring-2 ring-white",
              "dark:ring-[#0f172a]",
              "shadow-[0_2px_6px_-1px_rgba(217,119,6,0.55)]",
            )}
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

export default HomeownerBottomBar;
