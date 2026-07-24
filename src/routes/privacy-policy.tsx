import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Migration Guardian" },
      {
        name: "description",
        content:
          "How Migration Guardian collects, processes, and protects your personal data under GDPR.",
      },
      { property: "og:title", content: "Privacy Policy — Migration Guardian" },
      {
        property: "og:description",
        content: "GDPR-aligned privacy policy for Migration Guardian users.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const lastUpdated = "2026-07-23";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <section className="mt-8 space-y-4 text-sm leading-6 text-foreground">
        <h2 className="text-xl font-semibold">1. Data Controller</h2>
        <p>
          The data controller responsible for personal data processed via this service is Migration
          Guardian. Contact details are available on the Impressum page.
        </p>

        <h2 className="text-xl font-semibold">2. Data We Collect</h2>
        <p>
          Account information (name, email), professional profile data, job and timesheet records,
          and technical logs strictly necessary to operate the service.
        </p>

        <h2 className="text-xl font-semibold">3. Legal Basis (GDPR Art. 6)</h2>
        <p>
          Processing is based on contract performance, legitimate interest in operating a secure
          platform, and — where applicable — your consent.
        </p>

        <h2 className="text-xl font-semibold">4. Your Rights</h2>
        <p>
          You may request access, rectification, erasure, restriction, portability, and object to
          processing at any time by contacting us.
        </p>

        <h2 className="text-xl font-semibold">5. Retention</h2>
        <p>
          We retain personal data only as long as necessary for the purposes described above or as
          required by law.
        </p>

        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>Questions about this policy: see the Impressum page for contact details.</p>
      </section>
    </main>
  );
}
