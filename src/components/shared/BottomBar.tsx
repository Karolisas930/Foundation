/**
 * BottomBar — floating mobile bottom bar.
 * Theme-aware: white frosted glass in light mode, dark slate in dark mode.
 * Inactive icons crisp gray; active icon uses primary accent (orange-glow).
 * Notification badge is vivid orange with white text.
 */
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Wallet, Bell, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotifications } from "@/features/shared/notifications/hooks/useUnreadNotifications";
import { useDashboard } from "@/routes/_dashboard/route";
import { HomeownerBottomBar } from "./HomeownerBottomBar";

interface BottomBarItem {
  to: string;
  label: string;
  Icon: typeof Wallet;
  badge?: number;
}

const ITEMS: BottomBarItem[] = [
  { to: "/finanz", label: "Finanz", Icon: Wallet },
  { to: "/notifications", label: "Alerts", Icon: Bell },
  { to: "/messages", label: "Chats", Icon: MessageCircle },
];

export function BottomBar() {
  const { isContractor } = useDashboard();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { count: unreadCount } = useUnreadNotifications();

  if (!isContractor) {
    return <HomeownerBottomBar />;
  }

  return (
    <nav
      aria-label="Quick navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-slate-100 bg-white/80 backdrop-blur-md",
        "shadow-[0_-1px_0_0_rgba(15,23,42,0.02),0_-8px_24px_-12px_rgba(15,23,42,0.08)]",
        "dark:border-slate-800 dark:bg-slate-950/80",
        "dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
        {ITEMS.map(({ to, label, Icon, badge }) => {
          const active = pathname === to;
          const liveBadge = to === "/notifications" ? unreadCount : (badge ?? 0);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (active) {
                    e.preventDefault();
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("nav:tab-toggled-off", { detail: { to } }),
                      );
                      const overlay =
                        (document.querySelector("[data-route-overlay]") as HTMLElement | null) ??
                        (document.querySelector("main") as HTMLElement | null);
                      if (overlay) {
                        overlay.style.willChange = "transform, opacity";
                        overlay.style.transition =
                          "transform 260ms cubic-bezier(0.32,0.72,0.35,1), opacity 220ms ease-out";
                        overlay.style.transform = "translateY(100%)";
                        overlay.style.opacity = "0";
                        window.setTimeout(() => {
                          void navigate({ to: "/contractor/profile" });
                        }, 240);
                        return;
                      }
                    }
                    void navigate({ to: "/contractor/profile" });
                  }
                }}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5",
                  "text-[10px] font-bold uppercase tracking-wider transition active:scale-95",
                  active
                    ? "text-orange-glow"
                    : "text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white",
                )}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={2.25} />
                  {liveBadge > 0 ? (
                    <span
                      className={cn(
                        "absolute -right-2 -top-1.5 grid min-h-[18px] min-w-[18px] place-items-center",
                        "rounded-full px-1 text-[10px] font-black leading-none text-white",
                        "bg-amber-500 ring-2 ring-white",
                        "dark:ring-[#0f172a]",
                        "shadow-[0_2px_6px_-1px_rgba(217,119,6,0.55)]",
                      )}
                      aria-label={`${liveBadge} unread notifications`}
                    >
                      {liveBadge > 99 ? "99+" : liveBadge}
                    </span>
                  ) : null}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomBar;
