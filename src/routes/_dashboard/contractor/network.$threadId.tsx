import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NetworkThreadView } from "@/features/shared/messaging/network/NetworkThreadView";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_dashboard/contractor/network/$threadId")({
  component: NetworkThreadRoute,
});

function NetworkThreadRoute() {
  const { threadId } = Route.useParams();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) =>
        setUserId(data.user?.id ?? null),
      );
  }, []);

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <NetworkThreadView threadId={threadId} currentUserId={userId} />;
}
