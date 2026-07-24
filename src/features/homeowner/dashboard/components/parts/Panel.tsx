export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel glass-panel-hover rounded-2xl p-5 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}
