type MetricProps = {
  label: string;
  value: string;
  hint?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: "orange" | "emerald" | "sky" | "violet";
};

const TINTS: Record<
  MetricProps["tint"],
  { ring: string; glow: string; iconBg: string; iconFg: string }
> = {
  orange: {
    ring: "border-orange/25",
    glow: "from-orange/20 via-orange/5 to-transparent",
    iconBg: "bg-orange/15",
    iconFg: "text-orange",
  },
  emerald: {
    ring: "border-emerald-400/25",
    glow: "from-emerald-400/20 via-emerald-400/5 to-transparent",
    iconBg: "bg-emerald-400/15",
    iconFg: "text-emerald-300",
  },
  sky: {
    ring: "border-sky-400/25",
    glow: "from-sky-400/20 via-sky-400/5 to-transparent",
    iconBg: "bg-sky-400/15",
    iconFg: "text-sky-300",
  },
  violet: {
    ring: "border-violet-400/25",
    glow: "from-violet-400/20 via-violet-400/5 to-transparent",
    iconBg: "bg-violet-400/15",
    iconFg: "text-violet-300",
  },
};

export function MetricCard({ label, value, hint, Icon, tint }: MetricProps) {
  const t = TINTS[tint];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${t.ring} bg-white/[0.03] p-4 transition hover:bg-white/[0.05]`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-radial ${t.glow} blur-2xl opacity-70 transition-transform duration-500 group-hover:scale-110`}
        style={{
          background: `radial-gradient(closest-side, currentColor, transparent)`,
          color: "transparent",
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white">
            {value}
          </p>
          {hint ? <p className="mt-1 truncate text-[11px] text-white/50">{hint}</p> : null}
        </div>
        <span
          className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg} ${t.iconFg} animate-dash-float`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
