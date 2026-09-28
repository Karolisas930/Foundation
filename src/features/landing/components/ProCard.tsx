import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin } from "lucide-react";
import type { LandingPro } from "@/lib/landing-stats.functions";

/** "Verified Meister Pros" card format — opens the pro's public profile. */
export function ProCard({ pro }: { pro: LandingPro }) {
  const location = [pro.zip, pro.city].filter(Boolean).join(" · ");
  return (
    <Link
      to="/p/$profileId"
      params={{ profileId: pro.id }}
      className="group block rounded-2xl border border-border bg-card/90 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-orange/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-foreground group-hover:text-orange-glow">
              {pro.name}
            </h3>
            {pro.verified && (
              <BadgeCheck className="size-4 shrink-0 text-orange-glow" aria-label="Verified" />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{pro.trade}</p>
          {location && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" /> {location}
            </p>
          )}
        </div>
        {pro.rating != null && pro.rating > 0 && (
          <div className="shrink-0 rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[11px] font-bold text-orange-glow">
            ★ {pro.rating.toFixed(1)}
          </div>
        )}
      </div>
    </Link>
  );
}
