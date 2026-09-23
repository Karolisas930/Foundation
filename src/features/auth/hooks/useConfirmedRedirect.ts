/**
 * useConfirmedRedirect — makes a "check your email" screen reactive.
 *
 * Mobile browsers share auth storage across tabs, so the moment the person
 * confirms via the email link the session appears here too. We watch for it
 * (event + short poll for cross-tab storage writes) and route this tab to the
 * dashboard on its own, instead of leaving it stuck on the old screen.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveDashboardPath } from "@/lib/account-role";

export function useConfirmedRedirect(active: boolean) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function go() {
      if (cancelled) return;
      setConfirmed(true);
      const target = await resolveDashboardPath();
      setTimeout(() => {
        if (!cancelled) void navigate({ to: target });
      }, 1200);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) void go();
    });

    const poll = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        clearInterval(poll);
        void go();
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      sub.subscription.unsubscribe();
    };
  }, [active, navigate]);

  return confirmed;
}
