import { AlertTriangle } from "lucide-react";

export function CloudNotConnectedBanner() {
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/60 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:shadow-none"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
      <div className="min-w-0">
        <p className="font-semibold text-amber-950 dark:text-amber-100">
          Sign-in is not connected yet
        </p>
        <p className="mt-0.5 text-amber-800 dark:text-amber-200/80">
          Enable Lovable Cloud to activate Google, magic links, and password sign-in.
        </p>
      </div>
    </div>
  );
}
