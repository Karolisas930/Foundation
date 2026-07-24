/**
 * ============================================================================
 *  PROTECTED CORE FILE — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
 * ----------------------------------------------------------------------------
 *  This file is part of the Chameleon / Dynamic Sector core and the project's
 *  shared theming surface. Edits here cascade across every sector, route, and
 *  visual primitive. Refactors, renames, "cleanups", or stylistic rewrites
 *  are NOT permitted unless the user has specifically requested a change to
 *  this file by name.
 *
 *  Allowed: additive, backwards-compatible fixes the user explicitly asked for.
 *  Forbidden: silent reorganization, removing exports, changing public API,
 *  swapping tokens, or "modernizing" patterns.
 * ============================================================================
 */
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Toggle theme"
        className={
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
          className
        }
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <ThemeItem
          value="light"
          active={theme}
          onSelect={setTheme}
          icon={<Sun className="h-4 w-4" />}
          label="Light"
        />
        <ThemeItem
          value="dark"
          active={theme}
          onSelect={setTheme}
          icon={<Moon className="h-4 w-4" />}
          label="Dark"
        />
        <ThemeItem
          value="system"
          active={theme}
          onSelect={setTheme}
          icon={<Monitor className="h-4 w-4" />}
          label="System"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeItem({
  value,
  active,
  onSelect,
  icon,
  label,
}: {
  value: Theme;
  active: Theme;
  onSelect: (t: Theme) => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <DropdownMenuItem onClick={() => onSelect(value)} className="gap-2">
      {icon}
      <span>{label}</span>
      {active === value && <span className="ml-auto text-xs opacity-70">✓</span>}
    </DropdownMenuItem>
  );
}
