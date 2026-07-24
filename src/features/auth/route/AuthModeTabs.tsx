import type { Mode } from "./types";

export function AuthModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="mb-4 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1"
    >
      {(["signin", "signup"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={`h-9 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
            mode === m ? "bg-orange text-white shadow-sm" : "text-slate-300 hover:text-white"
          }`}
        >
          {m === "signin" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}
