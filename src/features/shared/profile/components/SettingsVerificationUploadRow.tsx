import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type VerifRowState =
  | { status: "idle" }
  | { status: "extracting"; fileName: string }
  | { status: "done"; fileName: string; summary: string };

export function SettingsVerificationUploadRow({
  icon: Icon,
  title,
  state,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  state: VerifRowState;
  onClick: () => void;
}) {
  const busy = state.status === "extracting";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-4 text-left transition hover:border-orange/40 hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-90 sm:px-5"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {busy ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-orange" />
        ) : (
          <Icon className="size-5 shrink-0 text-orange" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{title}</span>
          {busy ? (
            <span className="mt-2 flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[11px] font-medium text-orange">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange" />
                AI extracting verification details…
              </span>
              <Skeleton className="h-2 w-3/4 rounded-full" />
              <Skeleton className="h-2 w-1/2 rounded-full" />
            </span>
          ) : state.status === "done" ? (
            <span className="mt-0.5 block truncate text-[11px] text-slate-400">
              {state.summary}
            </span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium text-slate-400">
        {busy ? "Analyzing…" : state.status === "done" ? "Pending review" : "Upload"}
      </span>
    </button>
  );
}
