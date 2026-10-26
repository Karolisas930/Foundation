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

import { useEffect } from "react";
import { LandingPage } from "@/features/landing/components/LandingPage";

function Index() {
  // If an email link fell back to the home page (redirect URL not allow-listed),
  // hand it to /auth/callback so the person lands on their dashboard instead.
  useEffect(() => {
    const { search, hash } = window.location;
    const q = new URLSearchParams(search);
    const fromEmail =
      q.has("code") || q.has("token_hash") || /access_token=|type=(magiclink|signup)/.test(hash);
    if (!fromEmail) return;
    if (!q.has("sector")) q.set("sector", "homeowner");
    window.location.replace(`/auth/callback?${q.toString()}${hash}`);
  }, []);
  return <LandingPage />;
}
