import type { MapPin } from "lucide-react";

export function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        <Icon className="size-3.5 text-orange" /> {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
