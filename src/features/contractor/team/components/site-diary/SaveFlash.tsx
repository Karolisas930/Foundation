import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function SaveFlash({ tick, count }: { tick: number; count: number }) {
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (!tick) return;
    setShowSaved(true);
    const t = window.setTimeout(() => setShowSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [tick]);
  if (showSaved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        <Sparkles className="h-3 w-3" />
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/70">
      {count} saved
    </span>
  );
}
