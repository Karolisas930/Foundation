import { Info, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TrustBadge({
  icon: Icon,
  label,
  info,
}: {
  icon: typeof ShieldCheck;
  label: string;
  info?: string;
}) {
  const base = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[11px] font-semibold text-orange-glow transition hover:-translate-y-0.5 hover:border-orange/50 hover:bg-orange/20">
      <Icon className="size-3.5 text-orange-glow" />
      {label}
      {info && <Info className="size-3 text-orange-glow/75" aria-hidden />}
    </span>
  );
  if (!info) return base;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help" aria-label={`${label} — more info`}>
          {base}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs leading-5">{info}</PopoverContent>
    </Popover>
  );
}

export function Metric({
  value,
  label,
  onClick,
  hint,
}: {
  value: string;
  label: string;
  onClick?: () => void;
  hint?: string;
}) {
  const inner = (
    <>
      <div className="font-display text-xl font-extrabold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground group-hover:text-orange-glow">
        {label}
      </div>
      {hint && (
        <div className="mt-1 text-[10px] font-medium normal-case tracking-normal text-muted-foreground/80 group-hover:text-foreground/80">
          {hint}
        </div>
      )}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group cursor-pointer rounded-xl border border-white/10 bg-[#111424]/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-orange/40 hover:bg-[#111424]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
        aria-label={`${label} — ${value}`}
      >
        {inner}
      </button>
    );
  }
  return <div className="rounded-xl border border-white/10 bg-[#111424]/70 p-3">{inner}</div>;
}

export function CraneScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id="craneOrange" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--orange-glow)" />
          <stop offset="100%" stopColor="var(--orange)" />
        </linearGradient>
      </defs>
      <rect x="96" y="60" width="8" height="120" fill="url(#craneOrange)" opacity="0.85" />
      <line x1="96" y1="60" x2="104" y2="180" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          x1="96"
          y1={70 + i * 20}
          x2="104"
          y2={80 + i * 20}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />
      ))}
      <g className="crane-arm">
        <rect x="20" y="56" width="160" height="6" fill="url(#craneOrange)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1={28 + i * 20}
            y1="56"
            x2={38 + i * 20}
            y2="62"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.6"
          />
        ))}
        <rect x="14" y="50" width="14" height="18" rx="2" fill="rgba(255,255,255,0.18)" />
        <g className="crane-hook">
          <line
            x1="160"
            y1="62"
            x2="160"
            y2="110"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.8"
          />
          <rect x="154" y="110" width="12" height="8" rx="1.5" fill="url(#craneOrange)" />
        </g>
      </g>
      <polygon points="80,180 120,180 110,194 90,194" fill="rgba(255,255,255,0.15)" />
      <circle cx="160" cy="120" r="2" fill="var(--orange-glow)" className="crane-spark" />
    </svg>
  );
}
