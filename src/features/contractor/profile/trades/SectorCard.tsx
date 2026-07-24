import type { ReactNode } from "react";

export function SectorCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <h2 className="font-display text-base font-extrabold">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
