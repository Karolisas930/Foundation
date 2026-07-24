import { Label } from "@/components/ui/label";

interface CardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tone?: 1 | 2 | 3 | 4 | 5;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ id, icon, title, subtitle, tone, headerAction, children }: CardProps) {
  return (
    <section
      id={id}
      className="mb-4 scroll-mt-24 rounded-2xl border border-slate-800/80 bg-[#1e293b]/60 p-4 shadow-xl transition-all duration-200 hover:border-slate-700 sm:mb-6 sm:p-6"
    >
      <header className="mb-5 flex items-start gap-3">
        <span className="relative mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-orange/30 bg-orange/15 text-orange">
          {icon}
          {tone && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white shadow"
            >
              {tone}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-sm leading-5 text-slate-400">{subtitle}</p>}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ id, label, icon, required, children }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
        {icon}
        {label}
        {required && (
          <span className="font-bold text-orange" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-400/15 bg-[color:var(--navy-deep)]/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
