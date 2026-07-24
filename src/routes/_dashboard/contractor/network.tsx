import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NetworkChatPage } from "@/features/shared/messaging/network/NetworkChatPage";

export const Route = createFileRoute("/_dashboard/contractor/network")({
  head: () => ({
    meta: [
      { title: "Trade Network — HANDWERK" },
      {
        name: "description",
        content: "Contractor-to-contractor B2B messaging, isolated from client inquiries.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NetworkLayout,
});

function NetworkLayout() {
  return (
    <NetworkChatPage>
      <Outlet />
    </NetworkChatPage>
  );
}
