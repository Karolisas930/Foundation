/**
 * AuthLayout — chrome for /auth, /reset-password and other auth screens.
 * Centres a card on the dark navy backdrop with the shared TopBar on top.
 */
import type { ReactNode } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-50">
      <TopBar showSignIn={false} />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && (
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && <p className="mt-2 text-sm text-slate-300">{subtitle}</p>}
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm sm:p-8",
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
