/**
 * TopBar — canonical top bar used across every page.
 *
 * Responsive behaviour
 *   • Desktop (md+): logo left, inline guest nav in the centre, actions right.
 *   • Mobile (<md):  logo + actions on one line. Guest visitors get a
 *     hamburger that opens a right-side Sheet with the same nav links.
 *     Signed-in users continue to use the full AppSideMenu drawer.
 */
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { HeaderActions } from "@/components/shared/HeaderActions";
import { AppSideMenu } from "@/components/shared/AppSideMenu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TopBarProps {
  showSignIn?: boolean;
  signInTo?: string;
  signInLabel?: string;
  showMenu?: boolean;
}

const GUEST_NAV: ReadonlyArray<{ to: string; label: string }> = [
  { to: "/", label: "Home" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#for-trades", label: "For Trades" },
];

export function TopBar({
  showSignIn = true,
  signInTo = "/login",
  signInLabel = "Sign In",
  showMenu,
}: TopBarProps) {
  const { isAuthenticated, user } = useAuth();
  const signedIn = isAuthenticated && !!user;

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const profileAreaPrefixes = [
    "/contractor/profile",
    "/contractor/performance",
    "/finanz",
    "/settings",
    "/notifications",
  ];
  const inProfileArea = profileAreaPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const logoTo = inProfileArea ? "/contractor/profile" : "/";

  const renderSignedInMenu = signedIn && (showMenu ?? true);
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/80 backdrop-blur-md supports-[backdrop-filter]:bg-navy/65 dark:bg-navy/80">
      <div
        className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Left: hamburger (signed-in) + logo */}
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          {renderSignedInMenu && <AppSideMenu />}
          <Link
            to={logoTo}
            aria-label="Go to home"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90 sm:text-xl"
          >
            <span className="text-orange">HANDWERK</span>
          </Link>
        </div>

        {/* Center: guest nav (desktop only) */}
        {!signedIn && (
          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {GUEST_NAV.map((item) => {
              const isActive =
                item.to === "/" ? pathname === "/" : pathname === item.to.split("#")[0];
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/80 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-orange"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Push right cluster when signed-in (no nav to fill center) */}
        {signedIn && <div className="flex-1" />}

        {/* Right: actions + mobile guest hamburger */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderActions
            key={user?.id ?? "guest"}
            showSignIn={showSignIn}
            signInTo={signInTo}
            signInLabel={signInLabel}
          />

          {!signedIn && (
            <Sheet open={guestMenuOpen} onOpenChange={setGuestMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={guestMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={guestMenuOpen}
                  className="relative h-10 w-10 rounded-full text-white transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-orange/60 md:hidden"
                >
                  <Menu
                    className={cn(
                      "absolute h-5 w-5 transition-all duration-300 ease-out",
                      guestMenuOpen
                        ? "rotate-90 scale-75 opacity-0"
                        : "rotate-0 scale-100 opacity-100",
                    )}
                    strokeWidth={2}
                  />
                  <X
                    className={cn(
                      "absolute h-5 w-5 transition-all duration-300 ease-out",
                      guestMenuOpen
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-75 opacity-0",
                    )}
                    strokeWidth={2}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[86vw] max-w-sm flex-col border-l border-white/10 bg-[#0f172a] p-0 text-slate-50"
              >
                <SheetHeader className="border-b border-white/10 p-4 text-left">
                  <SheetTitle className="font-display text-lg font-bold tracking-tight text-white">
                    <span className="text-orange">HANDWERK</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-white/55">
                    Explore the platform
                  </SheetDescription>
                </SheetHeader>

                <nav className="flex flex-col gap-1 overflow-y-auto p-3">
                  {GUEST_NAV.map((item) => {
                    const isActive =
                      item.to === "/" ? pathname === "/" : pathname === item.to.split("#")[0];
                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          className={cn(
                            "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                            isActive
                              ? "bg-orange/15 text-white ring-1 ring-orange/40"
                              : "text-white/85 hover:bg-white/[0.06] hover:text-white",
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                {showSignIn && (
                  <div className="mt-auto border-t border-white/10 p-4">
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="btn-glow btn-glow-hover h-12 w-full rounded-full text-sm font-semibold"
                      >
                        <Link to={signInTo as "/login"}>{signInLabel}</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
