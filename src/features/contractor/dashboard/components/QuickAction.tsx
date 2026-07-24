import { Link } from "@tanstack/react-router";

type QAProps = {
  to?: string;
  search?: Record<string, string>;
  onClick?: () => void;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function QuickAction({ to, search, onClick, label, Icon }: QAProps) {
  const className =
    "group flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]";
  const inner = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/90 transition group-hover:bg-orange/20 group-hover:text-orange">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[12px] font-semibold leading-tight text-white/90">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return (
    <Link to={to!} search={search as never} className={className}>
      {inner}
    </Link>
  );
}
