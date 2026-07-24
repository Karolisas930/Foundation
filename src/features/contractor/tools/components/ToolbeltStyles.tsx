import { cn } from "@/lib/utils";

/* Shared laser + audio keyframes (injected once per open sheet). */
export function ToolbeltStyles() {
  return (
    <style>{`
      @keyframes tb-laser {
        0%   { top: 0%;   opacity: 0.85; }
        50%  { opacity: 1; }
        100% { top: 100%; opacity: 0.85; }
      }
      .tb-laser {
        animation: tb-laser 2.2s linear infinite;
        box-shadow: 0 0 12px 2px hsl(24 100% 55% / 0.9), 0 0 32px 6px hsl(24 100% 55% / 0.35);
      }
      @keyframes tb-wave {
        0%,100% { transform: scaleY(0.25); }
        50%     { transform: scaleY(1); }
      }
      .tb-wave-bar {
        transform-origin: center;
        animation: tb-wave 1s ease-in-out infinite;
      }
    `}</style>
  );
}

export function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-white/70">{label}</span>
      <span className={cn("font-semibold", accent ? "text-orange" : "text-white")}>{value}</span>
    </div>
  );
}
