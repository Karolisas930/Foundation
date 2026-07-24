export function ContractorAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <div
      aria-hidden
      className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange/80 to-orange-glow/70 font-display text-sm font-black text-white shadow-[0_6px_18px_-8px_rgba(234,88,12,0.65)] ring-1 ring-white/10"
    >
      {initials}
    </div>
  );
}
