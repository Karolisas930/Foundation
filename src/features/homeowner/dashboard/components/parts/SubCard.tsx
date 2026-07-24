import type { MapPin } from "lucide-react";

export function SubCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        <Icon className="size-3.5 text-orange" /> {title}
      </div>
      {children}
    </div>
  );
}
