import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Migration Guardian" },
      {
        name: "description",
        content: "The terms and conditions that govern your use of Migration Guardian.",
      },
      { property: "og:title", content: "Terms of Service — Migration Guardian" },
      {
        property: "og:description",
        content: "Terms of use, acceptable behavior, and liability for Migration Guardian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const lastUpdated = "2026-07-23";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <section className="mt-8 space-y-4 text-sm leading-6 text-foreground">
        <h2 className="text-xl font-semibold">1. Acceptance</h2>
        <p>
          By accessing or using Migration Guardian you agree to these terms. If you do not agree, do
          not use the service.
        </p>

        <h2 className="text-xl font-semibold">2. Accounts</h2>
        <p>
          You are responsible for keeping credentials secure and for all activity under your
          account.
        </p>

        <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
        <p>
          Do not misuse the service, attempt to break security, submit malicious content, or violate
          applicable law.
        </p>

        <h2 className="text-xl font-semibold">4. Content</h2>
        <p>
          You retain ownership of content you submit and grant us a limited license to host,
          process, and display it for the purpose of operating the service.
        </p>

        <h2 className="text-xl font-semibold">5. Termination</h2>
        <p>
          We may suspend or terminate access for breach of these terms or to protect the service and
          its users.
        </p>

        <h2 className="text-xl font-semibold">6. Disclaimer & Liability</h2>
        <p>
          The service is provided on an “as is” basis. To the extent permitted by law we exclude
          implied warranties and limit liability to the amounts paid for the service in the prior 12
          months.
        </p>

        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>See the Impressum page for contact details.</p>
      </section>
    </main>
  );
}
