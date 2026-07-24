import { createFileRoute } from "@tanstack/react-router";

const TITLE = "HANDWERK - Construction Marketplace";
const DESCRIPTION =
  "HANDWERK is the construction marketplace connecting homeowners, trade professionals, businesses, and architects across Germany.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

import { LandingPage } from "@/features/landing/components/LandingPage";

function Index() {
  return <LandingPage />;
}
