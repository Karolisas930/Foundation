import type { MapPin } from "lucide-react";

export function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
      <Icon className="mx-auto size-3.5 text-orange" />
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
