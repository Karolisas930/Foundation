/**
 * useUser — resolves the currently signed-in Supabase user + their
 * `profiles` row (id, account_type, display_name, avatar_url).
 *
 * Returns:
 *   - user:         auth user (null when signed out)
 *   - profile:      minimal profile projection (null when no row / signed out)
 *   - accountType:  profile.account_type (null when unknown)
 *   - isContractor: true when accountType is set and not "homeowner"
 *                   (handyman / business / architect / etc. all read as contractor)
 *   - loading:      true during initial resolve
 *
 * Never throws — signed-out or fetch-failure yields nulls + loading=false.
 */
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface MinimalProfile {
  id: string;
  account_type: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UseUserResult {
  user: User | null;
  profile: MinimalProfile | null;
  accountType: string | null;
  isContractor: boolean;
  loading: boolean;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MinimalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(uid: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, account_type, display_name, avatar_url")
          .eq("id", uid)
          .maybeSingle();
        if (cancelled) return;
        setProfile((data as MinimalProfile | null) ?? null);
      } catch {
        if (!cancelled) setProfile(null);
      }
    }

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession();
        const sessUser = data.session?.user ?? null;
        if (cancelled) return;
        setUser(sessUser);
        if (sessUser) await loadProfile(sessUser.id);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (cancelled) return;
      const nextUser: User | null = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        void loadProfile(nextUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const accountType = profile?.account_type ?? null;
  const isContractor = accountType !== null && accountType !== "homeowner";

  return { user, profile, accountType, isContractor, loading };
}

export default useUser;
