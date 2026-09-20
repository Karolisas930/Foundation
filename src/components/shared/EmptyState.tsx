/**
 * EmptyState + DashboardSkeleton — shared "nothing here yet" and "still
 * loading" surfaces for the dashboards.
 *
 * A blank panel makes a working dashboard look broken. Every list that can
 * legitimately be empty should say what the next step is and offer the button
 * that takes it, and every list that is still fetching should show its shape
 * rather than a bare sentence.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  actionSearch,
  onAction,
  hints,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  /** Route to navigate to; omit and pass onAction for in-page actions. */
  actionTo?: string;
  actionSearch?: Record<string, string>;
  onAction?: () => void;
  /** Short "what happens next" bullets shown under the action. */
  hints?: string[];
}) {
  const action = actionLabel ? (
    actionTo ? (
      <Button
        asChild
        className="mt-5 h-11 rounded-full bg-orange px-6 text-sm font-semibold text-white hover:bg-orange/90"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link to={actionTo as any} search={actionSearch as any}>
          {actionLabel}
        </Link>
      </Button>
    ) : (
      <Button
        onClick={onAction}
        className="mt-5 h-11 rounded-full bg-orange px-6 text-sm font-semibold text-white hover:bg-orange/90"
      >
        {actionLabel}
      </Button>
    )
  ) : null;

  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orange/10 text-orange">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action}
      {hints && hints.length > 0 && (
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-xs text-slate-400">
          {hints.map((hint, i) => (
            <li key={hint} className="flex gap-2">
              <span className="mt-[2px] flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-200">
                {i + 1}
              </span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Card-shaped placeholders matching the density of a dashboard list. */
export function DashboardSkeleton({
  rows = 3,
  withStats = false,
}: {
  rows?: number;
  withStats?: boolean;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {withStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Skeleton className="h-3 w-16 bg-white/10" />
              <Skeleton className="mt-3 h-7 w-12 bg-white/10" />
            </div>
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 bg-white/10" />
              <Skeleton className="h-3 w-1/3 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
          </div>
          <Skeleton className="mt-4 h-3 w-full bg-white/10" />
          <Skeleton className="mt-2 h-3 w-4/5 bg-white/10" />
        </div>
      ))}
    </div>
  );
}
