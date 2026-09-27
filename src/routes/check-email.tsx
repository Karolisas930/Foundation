import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { ResendConfirmationForm } from "@/features/auth/components/ResendConfirmationForm";

type Sector = "homeowner" | "handyman" | "business" | "architect";
const SECTORS: readonly Sector[] = ["homeowner", "handyman", "business", "architect"];

export const Route = createFileRoute("/check-email")({
  validateSearch: (search: Record<string, unknown>): { email?: string; sector?: Sector } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    sector:
      typeof search["sector"] === "string" && SECTORS.includes(search["sector"] as Sector)
        ? (search["sector"] as Sector)
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Confirm your email — HANDWERK" },
      { name: "description", content: "Confirm your email address to open your HANDWERK dashboard." },
      { property: "og:title", content: "Confirm your email — HANDWERK" },
      { property: "og:description", content: "Confirm your email address to open your dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email, sector } = Route.useSearch();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?sector=${sector ?? "homeowner"}&pw=1`
      : undefined;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <MailCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email ?? "your email address"}</span>.
          Click it to open your dashboard.
        </p>
        <ResendConfirmationForm defaultEmail={email ?? ""} redirectTo={redirectTo} compact />
        <Link to="/login" className="mt-6 inline-block text-sm text-primary underline">
          Already confirmed? Log in
        </Link>
      </div>
    </main>
  );
}
