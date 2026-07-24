/**
 * useTeamMembers — subscribe to the local team roster.
 *
 * Thin React hook wrapping the vanilla `team-store` (loadTeam +
 * subscribeTeam). Keeps components free of subscription boilerplate.
 */
import { useEffect, useState } from "react";

import { loadTeam, subscribeTeam, type TeamMember } from "@/features/contractor/team/team-store";

export function useTeamMembers(): TeamMember[] {
  const [members, setMembers] = useState<TeamMember[]>(() => loadTeam());

  useEffect(() => {
    const unsub = subscribeTeam(() => setMembers(loadTeam()));
    return unsub;
  }, []);

  return members;
}
