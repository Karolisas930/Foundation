/**
 * Sync locally-classified priority leads into the `public.notifications`
 * table so the bell/count reflects real deliverable alerts.
 *
 * - Runs client-side only.
 * - Dedupes via the (recipient_id, type, lead_id) unique index; an existing
 *   row for the same lead is ignored (no duplicate bell ping).
 * - Only priority leads (post-threshold) become notifications; alerts stay
 *   silent per Phase 3 spec.
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { dispatchLeadsForCurrentUser } from "@/features/contractor/leads/lead-dispatch";

export function usePriorityLeadNotifications(): void {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function sync() {
      try {
        const { priority } = dispatchLeadsForCurrentUser();
        if (cancelled || priority.length === 0) return;

        const rows = priority.map((lead) => ({
          recipient_id: userId,
          type: "priority_lead" as const,
          lead_id: lead.id,
          title: lead.project?.title
            ? `New priority lead: ${lead.project.title}`
            : "New priority lead",
          body: lead.project?.locationZip
            ? `${lead.trade ?? "Job"} • ${lead.project.locationZip}`
            : (lead.trade ?? null),
          score: lead.classification?.score?.percent ?? null,
          payload: {
            trade: lead.trade,
            zip: lead.locationZip,
            budget: lead.estimatedBudget,
          },
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("notifications").upsert(rows, {
          onConflict: "recipient_id,type,lead_id",
          ignoreDuplicates: true,
        });
      } catch {
        // Silent: notifications are best-effort; failure must not break UI.
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);
}
