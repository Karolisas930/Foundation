/**
 * Shared top-right header cluster: Language selector + Theme toggle, plus a
 * reactive auth affordance.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  User,
  Wrench,
  BarChart3,
  Settings,
  Bell,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeCycleButton } from "@/components/shared/ThemeCycleButton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isContractorType } from "@/lib/account-role";

interface HeaderActionsProps {
  showSignIn?: boolean;
  compact?: boolean;
  className?: string;
  signInTo?: string;
  signInLabel?: string;
}

function getInitials(email?: string, name?: string): string {
  const source = name || email || "U";
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function HeaderActions({
  showSignIn = true,
  compact = true,
  className = "",
  signInTo = "/login",
  signInLabel = "Sign in",
}: HeaderActionsProps) {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const signedIn = isAuthenticated && Boolean(user);
  // The account menu used to link straight to /contractor/profile and
  // /contractor/performance for EVERY signed-in user, which is how a
  // homeowner ended up inside a tradesperson profile from the top-right
  // avatar. Branch on the real account role instead.
  const isContractor = isContractorType(profile?.account_type);

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email ||
    "Account";

  const displayEmail = user?.email ?? "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? undefined;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e) {
      console.warn("[HeaderActions] signOut failed:", e);
    }
    void navigate({ to: "/", replace: true });
  }

  return (
    <div
      key={user?.id ?? "guest"} // ← Forces re-render when auth state changes
      className={"flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4 " + className}
    >
      <LanguageSelector compact={compact} className="h-10 min-w-10 px-1.5 sm:px-2.5" />
      <ThemeCycleButton className="h-10 w-10" />

      {signedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              title={displayName}
              className="rounded-full outline-none ring-offset-navy transition focus-visible:ring-2 focus-visible:ring-orange/60 focus-visible:ring-offset-2"
            >
              <Avatar className="h-10 w-10 border border-white/15">
                <AvatarImage src={avatarUrl} alt="" />
                <AvatarFallback className="bg-white/10 text-xs font-bold text-white">
                  {getInitials(displayEmail, displayName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 border-white/10 bg-[#0f172a] text-slate-50"
          >
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="truncate text-sm font-semibold text-white">{displayName}</span>
              {displayEmail && (
                <span className="truncate text-xs font-normal text-white/55">{displayEmail}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {isContractor ? (
              <>
                <DropdownMenuItem
                  onSelect={() => void navigate({ to: "/contractor/profile" })}
                  className="gap-2 focus:bg-white/10 focus:text-white"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void navigate({ to: "/contractor/performance" })}
                  className="gap-2 focus:bg-white/10 focus:text-white"
                >
                  <BarChart3 className="h-4 w-4" strokeWidth={1.5} />
                  Performance
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={() => void navigate({ to: "/homeowner" })}
                  className="gap-2 focus:bg-white/10 focus:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
                  My projects
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void navigate({ to: "/homeowner/properties" })}
                  className="gap-2 focus:bg-white/10 focus:text-white"
                >
                  <Building2 className="h-4 w-4" strokeWidth={1.5} />
                  My properties
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onSelect={() => void navigate({ to: "/notifications" })}
              className="gap-2 focus:bg-white/10 focus:text-white"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void navigate({ to: "/settings" })}
              className="gap-2 focus:bg-white/10 focus:text-white"
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="gap-2 text-red-300 focus:bg-red-500/15 focus:text-red-200"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        showSignIn && (
          <Button asChild size="sm" className="btn-glow btn-glow-hover h-10 px-3 text-sm sm:px-5">
            <Link to={signInTo as "/login"}>{signInLabel}</Link>
          </Button>
        )
      )}
    </div>
  );
}

export default HeaderActions;
