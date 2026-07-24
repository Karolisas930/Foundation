/**
 * DashboardLayout — shared chrome for signed-in app pages. Renders the
 * TopBar (with the AppSideMenu drawer) and the floating BottomBar around
 * a scrollable content column. Pure layout — content is passed as children.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { cn } from "@/lib/utils";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface LayoutErrorBoundaryState {
  error: Error | null;
}

class LayoutErrorBoundary extends Component<{ children: ReactNode }, LayoutErrorBoundaryState> {
  state: LayoutErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LayoutErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportLovableError(error, {
      boundary: "dashboard_layout",
      componentStack: info.componentStack ?? undefined,
    });
  }

  private handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong loading this page
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            A part of the dashboard failed to render. You can retry, or go back home and try again
            in a moment.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showBottomBar?: boolean;
}

export function DashboardLayout({
  children,
  className,
  contentClassName,
  showBottomBar = true,
}: DashboardLayoutProps) {
  return (
    <div className={cn("relative min-h-screen bg-[#0f172a] text-slate-50", className)}>
      <TopBar showMenu />
      <main
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6",
          showBottomBar ? "pb-24" : "pb-8",
          "pt-4 sm:pt-6",
          contentClassName,
        )}
      >
        <LayoutErrorBoundary>{children}</LayoutErrorBoundary>
      </main>
      {showBottomBar && <BottomBar />}
    </div>
  );
}

export default DashboardLayout;
