import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/contractor/network/")({
  component: NetworkIndex,
});

function NetworkIndex() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
      Select a thread on the left, or search the registry to start a B2B conversation.
    </div>
  );
}
