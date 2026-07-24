import { createFileRoute } from "@tanstack/react-router";
import { ChatsAppPage } from "@/features/shared/messaging/ChatsAppPage";

export const Route = createFileRoute("/_dashboard/messages")({
  head: () => ({ meta: [{ title: "Chats — HANDWERK" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  return <ChatsAppPage />;
}
