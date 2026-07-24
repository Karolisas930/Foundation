/**
 * Failure state with Try-Again (when a cached blob is available) and Reset.
 */
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorPanel({
  message,
  canRetry,
  onRetry,
  onReset,
}: {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-[12px] text-red-100">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-300" />
      <div className="flex-1">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-0.5 text-red-200/90">{message}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        {canRetry && (
          <Button
            type="button"
            size="sm"
            onClick={onRetry}
            className="h-7 rounded-full bg-orange px-2 text-[11px] font-semibold text-white hover:bg-orange/90"
          >
            <RefreshCw className="mr-1 size-3" /> Try Again
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          className="h-7 rounded-full border-red-300/40 bg-red-500/20 px-2 text-[11px] text-red-50 hover:bg-red-500/30"
        >
          <RefreshCw className="mr-1 size-3" /> Reset
        </Button>
      </div>
    </div>
  );
}
