/**
 * Cycling theme button: Light → Dark → System → Light...
 * Single click cycles. Uses the same useTheme hook as the protected
 * ThemeToggle so all three modes keep working everywhere.
 *
 * The button is rendered as a stable placeholder during SSR and the initial
 * hydration pass to avoid mismatches, then swaps to the live theme icon once
 * the client has mounted.
 */
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/hooks/use-theme";

const ORDER: Theme[] = ["light", "dark", "system"];
const LABEL: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeCycleButton({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (ORDER.includes(theme) ? theme : "system") as Theme;
  const nextTheme = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  const baseClass =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
    className;

  if (!mounted) {
    return (
      <button type="button" aria-label="Cycle theme" title="Cycle theme" className={baseClass}>
        <Monitor className="h-4 w-4" />
        <span className="sr-only">Cycle theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Theme: ${LABEL[current]}. Click for ${LABEL[nextTheme]}.`}
      title={`Theme: ${LABEL[current]} — click for ${LABEL[nextTheme]}`}
      className={baseClass}
    >
      <Icon
        key={current}
        className="h-4 w-4 transition-transform duration-300 ease-out motion-safe:animate-[spin_300ms_ease-out]"
      />
      <span className="sr-only">Current theme: {LABEL[current]}</span>
    </button>
  );
}

export default ThemeCycleButton;
